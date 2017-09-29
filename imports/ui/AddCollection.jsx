import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { DataCollections } from '../api/dataCollections';

export default class addCollection extends Component {

  submitDataCollection(event) {
    //prevent from refreshing
    event.preventDefault();

    let dataCollection = {
      name: this.refs.name.value,
      type: this.refs.type.value,
      ownerId: Meteor.userId(),
    }

    Meteor.call('insertDataCollection', dataCollection, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("DataCollection added");
        browserHistory.push('/datasets');
      }
    });
  }

  render() {
    return (
      <div className="row">
        <form className="col s12" onSubmit={this.submitDataCollection.bind(this)}>
          <h3>Add a new dataCollection</h3>

          <div className="row">
            <div className="input-field col s6">

              <input placeholder="数据集名称" ref="name" type="text" className="validate" />
            </div>
            <div className="input-field col s6">
              <input placeholder="数据集类型" ref="type" type="text" className="validate" />
            </div>
          </div>

          <div className="row">
            <div className="input-field col s6">
              <button type="submit" name="action" className="btn btn-success">Submit</button>
            </div>
          </div>

        </form>
      </div>
    )
  }
}
