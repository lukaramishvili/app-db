(defproject app-db "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.10.0"]
                 ;; for http/network
                 [ring/ring-core "1.8.2"]
                 [ring/ring-jetty-adapter "1.8.2"]
                 ;; for json responses
                 [ring/ring-json "0.5.0"]
                 ;; for "validation" (ensuring data structures are correct)
                 [metosin/malli "0.2.1"]
                 ;; for making http requests (for now, for testing from repl)
                 [clj-http "3.10.3"]
                 ;; for decoding payloads and encoding results (json for now, for js)
                 [cheshire "5.10.0"]]
  :main ^:skip-aot app-db.core
  :target-path "target/%s"
  ;; TODO If you are using the ring/ring-core namespace on its own, you may run into errors when executing tests or running alternative adapters. To resolve this, include the following dependency in your dev profile:
  ;; [javax.servlet/servlet-api "2.5"]
  :profiles {:uberjar {:aot :all}})
