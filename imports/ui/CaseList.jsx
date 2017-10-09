import React, { Component } from 'react';
import { Media } from 'react-bootstrap';
import { Cases }  from '../api/cases' ;
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

export default class CaseList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CaseList: []
    };
 
  }
  componentWillMount() {
    const temp = Cases.find({}).fetch();
    const b = DataCollections.find({}).fetch();
  }

  deleteCase(Case) {
    Meteor.call('deleteCase', Case, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("Case deleted");
      }
    });
  }

  render() {
    const textStyle = { margin: '50px' }
    const list = [{ a: 1, b: 2 }, { a: 2, b: 3 }]

    return (
      <div>
        {list.length && list.map((Case, index) => {
          return (
            <Media key={Case.b}>
              <Media.Left style={textStyle} >
                <p> {Case.a}</p>
                <p>{Case.a}</p>
                <p>{Case.a}</p>
                <p>{Case.a}</p>
                <p>{Case.a}</p>
                <p>{Case.a}</p>
              </Media.Left>
              <Media.Body>
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
              </Media.Body>
            </Media>
          )
        })

        }
      </div>
      // <ListItem
      // primaryText = {this.props.Case.name}
      // rightIcon={<ActionDeleteForever hoverColor={red500} onClick={this.deleteCase.bind(this, this.props.Case._id)}/>}
      //  />
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}