Meteor.publish('userData', function() {
  // console.log(this.userId);

  if(this.userId) {
    return Meteor.users.find({_id: this.userId}, {
      fields: {
        email: true,
        profile: true,
        roles: true
      }
    });
  } else {
    return this.ready();
  }
})
