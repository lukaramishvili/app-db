;;;;
;;;; #### precursor to request validation/parsing in core.clj

;; we want serializable type checking (data structure described in pure data), no code, (so implementable in js for example), so we use malli as a backend ^H^H malli supports keyword validators like :string.

;; (defn malli-field? [form]
;;   "usage: (malli-field? [:name :string])"
;;   (and (vector? form)
;;        (= 2 (count form))
;;        (every? keyword? form)))
;; (defn malli-field-of-type? [form type]
;;   "usage: (malli-field-of-type? [:name :string] :string)"
;;   (and (malli-field? form)
;;        (and (second form) (= (second form) type))))
;; (defn malli-field [form]
;;   "usage: (malli-field [:type :string]) => #'clojure.core/string?"
;;   (if (malli-field? form)
;;     (let [pred-fn-name (subs (str (second form) "?") 1)]
;;       ;; cheat and instead of checking for every field manually, e.g. :string => string? , convert :string to "string?" and resolve the symbol function
         ;; TODO doesn't work; but manual checking for :string :map etc, without using resolve, worked.
;;       (resolve (symbol (str pred-fn-name))))))
;; (defn dataform-to-malli-zipper
;;   "from http://josf.info/blog/2014/03/21/getting-acquainted-with-clojure-zippers/"
;;   [loc]
;;   (if (zip/end? loc)
;;     loc
;;     (let [v (zip/node loc)]
;;     (cond
;;       (malli-field? v) (recur (zip/next (zip/edit loc (fn [pair] [(first pair) (malli-field pair)]))))
;;       ;; base case: keep moving
;;       :else (recur (zip/next loc))))))

;; (defn dataform-to-malli [dataform]
;;   "converts [:type :string] to [:type string?]"
;;   (zip/root (dataform-to-malli-zipper (zip/vector-zip dataform))))

;; (def action-dataform [:map
;;                       [:type :string]
;;                       ;;[:for {:optional true} int?]
;;                       [:data :map]])

;; usage: (valid-action? {:type \"a\" :data {}})
(def valid-action?
  (m/validator
   (dataform-to-malli action-dataform)))
