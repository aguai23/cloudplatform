import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class Edit extends Component {


  showTeamStats() {
    this.props.showTeamStats();
  }

  editDataCollection(event) {
    //prevent from refreshing
    event.preventDefault();

    let dataCollection = {
      _id: this.props.currentDataCollection._id,
      name: this.refs.name.value,
      type: this.refs.type.value,
      ownerId: Meteor.userId(),
    }

    Meteor.call('updateDataCollection', dataCollection, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("DataCollection updated");
        this.showTeamStats();
      }
    });
  }

  render() {

    const currentDataCollection = this.props.currentDataCollection;

    return (
      <div className="row">
        <form className="col s12" onSubmit={this.editDataCollection.bind(this)}>
          <h3>添加新项目</h3>

          <div className="row">
            <div className="input-field col s6">
              <input placeholder="名称" ref="name" type="text" className="validate" defaultValue={currentDataCollection.name} />
            </div>
            <div className="input-field col s6">
              <input placeholder="type" ref="type" type="text" className="validate" defaultValue={currentDataCollection.type} />
            </div>
            <button type="submit">提交</button>
          </div>
        </form>
      </div>
    )
  }
}
