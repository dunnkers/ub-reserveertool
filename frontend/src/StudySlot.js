import React from 'react';
import { Badge,
     Button,
     Card,
     Tooltip,
     message } from 'antd';
import { CloseCircleOutlined,
        EditOutlined,
        BellOutlined,
        CheckOutlined } from '@ant-design/icons';

export default class StudySlot extends React.Component {
  render() {
    const result = this.props.slotinfo;
    const account = this.props.account;
    const booked = this.props.booked;
    const trigger = this.props.trigger;

    const regmsg = result.registration_msg;
    const fully_booked = regmsg && regmsg.msg.includes('fully booked');
    const not_open = regmsg && regmsg.msg.includes('Registrations open at');
    let triggertime = new Date(result.startdt);
    triggertime.setDate(triggertime.getDate() - 4);
    let triggerdate = triggertime.toDateString() + ' ' + triggertime.toLocaleTimeString();
    return (
      <Card
        key={result.id}
        title={result.date}
        extra={
          <>
            {fully_booked &&
              <Tooltip title={result.registration_msg.msg}>
                <Badge count={0} showZero>
                </Badge>
              </Tooltip>
            }
            {not_open &&
              <Tooltip title={result.registration_msg.msg}>
                <Badge count={90}
                  className="site-badge-count-4">
                </Badge>
              </Tooltip>
            }
            <Tooltip title={result.seatsleft_text}>
              <Badge count={result.seatsleft}
                style={{ backgroundColor: '#52c41a' }}>
              </Badge>
            </Tooltip>
          </>
        }
        style={{ width: 400, margin: '10px' }}
        actions={[
          <Tooltip title={booked ? 
              (trigger ? "Trigger set for " + triggerdate :
                "You are booked in ✓") :
              (result.registration_enabled ?
                "Book in now" :
                (fully_booked ? "Full" : "Book in when reservations open"))}>
            <Button
              type="default"
              icon={booked ? 
                (trigger ? <BellOutlined key="trigger" /> :
                  <CheckOutlined key="booked" />) :
                (result.registration_enabled ?
                <EditOutlined key="edit" /> :
                <BellOutlined key="schedule" />)}
              onClick={() => this.props.planReservering(result)}
              disabled={!account || fully_booked || booked}
              />
            </Tooltip>,
            <>{(trigger || booked) &&
              <Tooltip title={trigger ?
                "Cancel scheduled reservation" : "Cancel via email"}>
                <Button 
                    onClick={() => this.props.cancelReservering(result)}
                    type="default"
                    icon={<CloseCircleOutlined key="cancel" />}
                    disabled={!trigger}
                />
              </Tooltip>}
            </>
        ]}>
        {result.title}
      </Card>
    )
  }
}