(ns app-db.core
  (:require
   [ring.adapter.jetty :as jetty]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [ring.util.response :refer [response]]
   [malli.core :as m]
   [malli.util :as mu]
   [malli.error :as me]
   [clj-http.client :as client]
   ;; replace values in maps (used to replace :string with string? in dataform=>malli)
   [clojure.zip :as zip]
   ;; for parsing JSON (for now)
   [cheshire.core :refer :all])
  ;;(:use)
  (:gen-class))

;; we receive `actions` (declarative instructions) from clients
;; we turn them into `instructions` (what the server should perform)

(def Event [:map
             [:action :string]
             [:payload :map]])

(def data (atom {}))

;; TODO define handlers as datacode
(def dispatchers (atom {}))

(defn receive [action signature handler]
  (reset! dispatchers
          (assoc @dispatchers
                 action
                 {:signature signature
                  :handler handler})))

(defn describe-event [action]
  (:signature (get @dispatchers action)))

;; returns true or {:schema ...} m/explain results
(defn validate-event [event]
  (let [signature (describe-event (:action event))
        payload (:payload event)
        validate-payload (and signature (m/validator signature))]
    (if validate-payload (or (validate-payload payload)
                             (-> (m/explain signature payload)
                                 (me/humanize)))
        nil)))

;; turns an action into an instruction
(defn dispatch [action payload]
  (let [dispatcher (get @dispatchers action)
        handler (:handler dispatcher)]
    (handler payload)))

(defn update-data [path value]
  (reset! data
          (assoc-in @data path value)))

(receive :read-data
         [:map
          [:path [:vector :string]]]
         #(get-in @data (map keyword (:path %))))

(receive :update-data
         [:map
          [:path [:vector :string]]
          [:value [:or :map :string :boolean :int number?]]]
         #(update-data (map keyword (:path %)) (:value %)))

;; TODO HTTP HEAD requests for negotiating how the api is to be used before actually calling it.
;; request {
;;   "ssl-client-cert": null,
;;   "protocol": "HTTP/1.1",
;;   "remote-addr": "0:0:0:0:0:0:0:1",
;;   "headers": {
;;     "cookie": "ring-session=bd942012-3487-467f-a74e-374a2e60ae32",
;;     "accept": "*/*",
;;     "user-agent": "insomnia/2020.5.2",
;;     "host": "localhost:3000",
;;     "content-length": "67",
;;     "content-type": "application/json"
;;   },
;;   "server-port": 3000,
;;   "content-length": 67,
;;   "content-type": "application/json",
;;   "character-encoding": "UTF-8",
;;   "uri": "/",
;;   "server-name": "localhost",
;;   "query-string": null,
;;   "body": {
;;     "action": "read-data",
;;     "payload": {
;;       "path": [
;;         "a"
;;       ]
;;     }
;;   },
;;   "scheme": "http",
;;   "request-method": "post"
;; }
(defn handler [request]
  "receives action and payload from request, converts to instructions, and [probably] executes/queues them. TODO return m/explain results as validation errors."
  (if (= (:request-method request) :options)
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (generate-string
            (describe-event (keyword (get-in request [:body :action]))))}
  (let [event-body (:body request)
        event {:action (keyword (:action event-body))
               :payload (:payload event-body)}
        action (:action event)
        payload (:payload event)
        validation-result (validate-event event)
        valid (true? validation-result)
        result (and valid (dispatch action payload))
        http-status (if valid 200 419)
        errors (if (not valid) validation-result)]
    {:status http-status
     :headers {
               "Content-Type" "application/json"
               ;; TODO return the validator in HEAD request. this now throws error.
               ;;"Validator" Action
               }
     :body (generate-string (if valid
                              result
                              ;; errors ; TODO show real validation errors; even using into throws 'cannot JSON schema object'
                              {:errors errors}))})))

(def server 
  ;; important: creating a var on handler using #', so that re-evaluating handler forms will get applied automatically without restarting the server.
  (jetty/run-jetty (wrap-json-body #'handler {:keywords? true :bigdecimals? true})
                   {:port 3000
                    :join? false}))
;; (.start server)
;; (.stop server)

(defn -main
  "C-x C-l then call this from the repl to start the HTTP server."
  [& args]
  (println "Hello, World!"))

