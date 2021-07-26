;;;;
;;;; first, writing as much of pure logic in the cleanest form as much as possible,
;;;; and then adding what's missing to bring it to reality.

(ns app-db.domain)

(defn here []
  "this server"
  {:namespace ""
   })

;; we receive `actions` (declarative instructions) from clients
;; we turn them into `instructions` (what the server should perform)

(def Actor
  "Initiator of the process. User or program."
  [:map
   [:name :string]
   [:automated :boolean]])

(def Event
  ""
  [:map
   [:action :string]
   [:payload :map]])

;; noun
(def -Process
  "process consists of multiple actions (it's a multi-step action)"
  {:name :namespace/process-name
   :actions
   [
    {:name :namespace/action-name}
    ]})

  

