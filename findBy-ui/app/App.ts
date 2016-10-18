///<reference path="Reference.ts"/>
module TrialApp {
    export class App {
        module: ng.IModule;
        constructor() {
            this.module = angular.module('trialApp',['trialApp.controllers','restangular','ui.router',
            'ngAnimate', 'ngAria','ngMessages','ngMaterial','leaflet-directive']);
            var router = new TrialApp.Router();
            var bootstrapper = new TrialApp.Bootstrapper(this.module,router);
            bootstrapper.bootstrap();
        }
    }
    new App();
}