///<reference path="Reference.ts"/>
module TrialControllers {
    "use strict";
    export class AppTrialController {
        list: any;
        getResponseFromServer: () => any;
        showDropdown:Boolean;
        data:any;
        showId:(id)=>any;
        static $inject = [ 'Restangular'];
        constructor(restangular) {
            var vm = this;
            vm.getResponseFromServer = onGetButtonClicked;
            vm.showId=onShowingId;
            function onGetButtonClicked() {
                restangular.all('dm').getList().then((data)=>{
                    vm.showDropdown=true;
                    vm.data = data;
                })
            }
            function onShowingId(id){
                alert(id);
            }
        }
    }
}