
if (Meteor.isServer) {
  Accounts.onCreateUser(function (options, user) {
    user.profile = {
      isAdmin: options.isAdmin
    }
    return user;
  });
}

Meteor.users.deny({
  update() {
    return true
  }
})