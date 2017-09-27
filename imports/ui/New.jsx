import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Players } from '../api/players';


export default class New extends Component {

  submitPlayer(event) {
    //prevent from refreshing
    event.preventDefault();

    let player = {
      name: this.refs.name.value,
      team: this.refs.team.value,
      ballManipuation: this.refs.ballManipuation.value,
      kickingAbilities: this.refs.kickingAbilities.value,
      notes: this.refs.notes.value,
      createdAt: new Date(),
      owner: Meteor.userId(),
    }

    Meteor.call('insertPlayer', player, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("Player added");
        browserHistory.push('/');
      }
    });
  }

  render() {
    return (
      <div className="row">
        <form className="col s12" onSubmit={this.submitPlayer.bind(this)}>
          <h3>Add a new player</h3>

          <div className="row">
            <div className="input-field col s6">

              <input placeholder="Name" ref="name" type="text" className="validate" />
            </div>
            <div className="input-field col s6">
              <input placeholder="Team" ref="team" type="text" className="validate" />
            </div>
          </div>

          <div className="row">
            <div className="input-field col s6">
              <textarea placeholder="Notes" ref="notes" type="text" className="materialize-textarea" />
            </div>
            <div className="input-field col s6">
              <button className="btn waves-effect waves-light light-blue darken-3" type="submit" name="action">Submit
          <i className="material-icons right">send</i>
              </button>
            </div>
          </div>

        </form>
      </div>
    )
  }
}
