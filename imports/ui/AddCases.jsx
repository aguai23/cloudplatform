import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
export default class AddCase extends Component {

    submitDataCollection(event) {
        //prevent from refreshing
        event.preventDefault();

        let Case = {
            name: this.refs.name.value,
            type: this.refs.type.value,
            class: this.refs.class.value,
            label: this.refs.label.value,
            files: ['todo'],
            profile: { todo: 'todo' },
            collectionId: 'todo',
            ownerId: Meteor.userId(),
        }

        Meteor.call('insertCase', Case, (error) => {
            if (error) {
                alert("somethings wrong" + error.reason);
            } else {
                alert("Case added");
                browserHistory.push('/');
            }
        });
    }

    render() {
        return (
            <div className="row">
                <form className="col s12" onSubmit={this.submitDataCollection.bind(this)}>
                    <h3>Add a new case</h3>
                    <div className="row">
                        <div className="input-field col s4">
                            <input placeholder="病例名称" ref="name" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <input placeholder="病例种类" ref="type" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <input placeholder="病例类别" ref="class" type="text" className="validate" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="input-field col s4">
                            <input placeholder="标签" ref="label" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <input ref="files" type="file" className="validate" />
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
