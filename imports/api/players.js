import { Mongo } from 'meteor/mongo';

export const Players = new Mongo.Collection('players');

Players.allow({
  insert() {
    return false;
  },
  update() {
    return false;
  },
  remove() {
    return false;
  }
});

Players.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  }
});



const PlayerSchema = new SimpleSchema({
  name: {type : String },
  team: {type : String },
  notes: {type : String, optional:true },
  owner: { type: String, optional:true},
});

Players.attachSchema(PlayerSchema);
