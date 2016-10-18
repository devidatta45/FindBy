///<reference path="Reference.ts"/>
module TrialApp {
    export class Bootstrapper {
        constructor(public module: ng.IModule, public router: TrialApp.Router) {
        }
        bootstrap() {
            this.module.config(["RestangularProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider",
             (RestangularProvider: restangular.IProvider, $stateProvider: any, $urlRouterProvider: any, $httpProvider: any) =>
                this.initializeConfig(RestangularProvider, $stateProvider, $urlRouterProvider, $httpProvider)]);
        }
        initializeConfig(RestangularProvider: restangular.IProvider, $stateProvider: any, $urlRouterProvider: any, $httpProvider: ng.IHttpProvider) {
            this.initRestangular(RestangularProvider);
            this.router.initialize($stateProvider, $urlRouterProvider);
            //$http.defaults.headers.common.apiKey = localStorage.getItem("apiKey") ? localStorage.getItem("apiKey") : "12s-212";
        }
        initRestangular(RestangularProvider: any) {
            RestangularProvider.setParentless(true, []);
            RestangularProvider.setBaseUrl("http://localhost:9292/drum");
          //  if (localStorage.getItem("apiKey")) {
              //  RestangularProvider.setDefaultHeaders({ apiKey: "aa4608c6-567d-4906-bf11-ab89118f7d60" });
          //  } else {
              //  location.href = "index.html#/home";
           // }
        }
    }
}