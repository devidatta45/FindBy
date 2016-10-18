///<reference path="Reference.ts" />
module TrialControllers {
    export class SignUpController {
        signUpUser: (entity: any) => void;
        cancel:()=>void;
        static $inject = ["$state", "Restangular"]
        constructor($state, restangular) {
            var vm: any = this;
            init();
            function init(){
                vm.signUpUser=createUserAccount;
                vm.cancel=onCancelling;
            }
            function onCancelling(){
                $state.go("login");
            }
            function createUserAccount(entity:any) {
                entity.dob=(entity.dob).toISOString().split("T")[0]+"T00:00:00Z";
                entity.password="sdfdf";
                entity.isDeleted=false;
                entity.id =0;
                restangular.all('userAccounts').post(entity).then((data)=>{
                    console.log(data);
                    $state.go("login",{id:data.id});
                });
            }
        }
    }
}