import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Breadcrumb } from 'react-bootstrap';

const styles = {
  breadcrumb: {
    left: '100px'
  }
}

const nameMap = {
  '/': '首页',
  'datasets': '数据集',
  'newCase': '新建病例集'
}

export default class Header extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log("child props", this);
    return (
      <div>
        <Breadcrumb className='breadcrumb'>
          <img src={('public/img/PVmed.jpg')}/>
        {
          this.props.routes.map((route, i) => {
            if(i === this.props.routes.length - 1) {
              return (
                <Breadcrumb.Item href={route.path} key={route.path} active>
                  {nameMap[route.path]}
                </Breadcrumb.Item>
              )
            } else {
              return (
                <Breadcrumb.Item href={route.path} key={route.path}>
                  {nameMap[route.path]}
                </Breadcrumb.Item>
              )
            }
          })
        }
        </Breadcrumb>

      </div>

    );
  }
}

// const NavBar = React.createClass({
//   render: function() {
//     return (
//       xxx
//       <nav>
//         yyy
//       </nav>
//     );
//   }
// });
