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
          <h3>添加新项目</h3>

          <div className="row">
            <div className="input-field col s6">
              <input placeholder="姓名" ref="name" type="text" className="validate" defaultValue={currentPlayer.name} />
            </div>
            <div className="input-field col s6">
              <input placeholder="Team" ref="team" type="text" className="validate" defaultValue={currentPlayer.team} />
            </div>
            <button type="submit">提交</button>
          </div>
        </form>
      </div>
    )
  }
}
