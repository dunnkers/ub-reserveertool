import React from 'react';
import { Calendar, Badge } from 'antd';
import moment from 'moment';
import $ from 'jquery';
import { constructPostForm } from './util'; 

function getListData(value) {
    let listData;
    switch (value.date()) {
      case 8:
        listData = [
          { type: 'warning', content: 'This is warning event.' },
          { type: 'success', content: 'This is usual event.' },
        ];
        break;
      case 10:
        listData = [
          { type: 'warning', content: 'This is warning event.' },
          { type: 'success', content: 'This is usual event.' },
          { type: 'error', content: 'This is error event.' },
        ];
        break;
      case 15:
        listData = [
          { type: 'warning', content: 'This is warning event' },
          { type: 'success', content: 'This is very long usual event。。....' },
          { type: 'error', content: 'This is error event 1.' },
          { type: 'error', content: 'This is error event 2.' },
          { type: 'error', content: 'This is error event 3.' },
          { type: 'error', content: 'This is error event 4.' },
        ];
        break;
      default:
    }
    return listData || [];
  }
  
  function dateCellRender(value) {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map(item => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  }

export default class BookingPage extends React.Component {
    state = {
        value: moment(new Date()),
        selectedValue: moment(new Date()),
        reservations: []
    };

    componentDidMount() {
      $.ajax({
        url: 'https://libcal.rug.nl/ajax/calendar/list?c=7564&date=0000-00-00&perpage=96&page=1&audience=undefined&cats=&camps=&inc=0',
        dataType: 'jsonp'
      })
      .done((data) => this.setState({...data }));
    }

    setReservations = () => {
        fetch('http://35.228.177.55:3001/reservations/', constructPostForm({
            email: this.props.email
        }))
        .then(response => response.json())
        .then(data => {
            const triggers = data.triggers;
            const reservations = data.reservations.concat(triggers);
            this.setState({ reservations, triggers });
        })
    }

    componentDidUpdate() {
        if (this.props.email !== this.state.email) {
            this.setState({email: this.props.email});
            this.setReservations();
        }
    }
    
    onSelect = value => {
        this.setState({
            value,
            selectedValue: value,
        });
    };

    onPanelChange = value => {
        this.setState({ value });
    };

    dateCellRender(value) {
      const date = value.date();
    //   console.log(date);
    //   for (reservation of this.state.reservations) {
    //     reservation
    //   }

      return (
        <ul className="events">
          {/* {listData.map(item => (
            <li key={item.content}>
              <Badge status={item.type} text={item.content} />
            </li>
          ))} */}
        </ul>
      );
    }
    

  render() {
    const { value } = this.state;
    return (
      <div style={{padding:'10px'}}>
        {
            this.state.reservations.map((reservation, i) => {
                return <div>{i}</div>
            })
        }
        <Calendar value={value}
            onSelect={this.onSelect}
            dateCellRender={this.dateCellRender}
            />
      </div>
    )
  }
}