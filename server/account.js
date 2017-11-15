import {Main} from "../imports/ui/Main";

if (Meteor.isServer) {
  Accounts.onCreateUser(function (options, user) {
    user.profile = {
      isAdmin: Main.isAdmin
    }
    return user;
  });
}

Meteor.users.deny({
  update() {
    return true
  }
})