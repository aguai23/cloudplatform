import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class Edit extends Component {


  showTeamStats() {
    this.props.showTeamStats();
  }

  editPlayer(event) {
    //prevent from refreshing
    event.preventDefault();

    let player = {
      _id: this.props.currentPlayer._id,
      name: this.refs.name.value,
      team: this.refs.team.value,
      ballManipuation: this.refs.ballManipuation.value,
      kickingAbilities: this.refs.kickingAbilities.value,
      createdAt: new Date(),
      owner: Meteor.userId(),
    }

    Meteor.call('updatePlayer', player, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("Player updated");
        this.showTeamStats();
      }
    });
  }

  render() {

    const currentPlayer = this.props.currentPlayer;

    return (
      <div className="row">
        <form className="col s12" onSubmit={this.editPlayer.bind(this)}>
          <h3>Add a new player</h3>

          <div className="row">
            <div className="input-field col s6">

              <input placeholder="Name" ref="name" type="text" className="validate" defaultValue={currentPlayer.name} />
            </div>
            <div className="input-field col s6">
              <input placeholder="Team" ref="team" type="text" className="validate" defaultValue={currentPlayer.team} />
            </div>
          </div>

          <div className="row">
            <div className="col s6">
              <h5>Ball Manipulation</h5>
              <select className="browser-default" ref="ballManipuation" defaultValue={currentPlayer.ballManipuation}>
                <option value="0">0 - Hasn't demonstrated skills</option>
                <option value="1">1 - Needs improvement</option>
                <option value="2">2 - Skill acquired</option>
                <option value="3">3 - Great skills/could teach</option>
              </select>
            </div>

            <div className="col s6">
              <h5>Kicking Abilities</h5>
              <select className="browser-default" ref="kickingAbilities" defaultValue={currentPlayer.kickingAbilities}>
                <option value="0">0 - Hasn't demonstrated skills</option>
                <option value="1">1 - Needs improvement</option>
                <option value="2">2 - Skill acquired</option>
                <option value="3">3 - Great skills/could teach</option>
              </select>
            </div>
          </div>
        </form>
      </div>
    )
  }
}
