import React from 'react';
import { Badge,
     Button,
     Card,
     Tooltip, Tag} from 'antd';
import { CloseCircleOutlined,
        EditOutlined,
        BellOutlined,
        CheckOutlined,
        InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

export default class StudySlot extends React.Component {
  render() {
    const result = this.props.slotinfo;
    const account = this.props.account;
    const accinfo = account &&
                    account.email && 
                    account.fname && 
                    account.lname && 
                    account.q1 &&
                    account.phone;
    const booked = this.props.booked;
    const trigger = this.props.trigger;
    const force = this.props.force;

    // const fully_booked = result.seatsleft === 0;
    const msg = result.registration_msg && result.registration_msg.msg ? 
      result.registration_msg.msg : 'No info'
    const fully_booked = msg.includes('fully booked') ||
      result.seatsleft === 0;
    // const not_open = msg.includes('Registrations open at');
    let triggertime = new Date(result.startdt);
    triggertime.setDate(triggertime.getDate() - 4);
    let triggerdate = triggertime.toDateString() + ' ' + triggertime.toLocaleTimeString();
    return (
      <Card
        key={result.id}
        title={<>
            <span>{result.date}</span>
            <small style={{display:'block'}}>{result.libcal_name}</small>
          </>
        }
        extra={
          <>
            {fully_booked &&
              <Tooltip title={msg}>
                <Badge count={0} showZero>
                </Badge>
              </Tooltip>
            }
            {!fully_booked && !result.registration_enabled &&
              <Tooltip title={msg}>
                <Badge count={'All left'}
                  className="site-badge-count-4">
                </Badge>
              </Tooltip>
            }
            {result.seatsleft > 0 &&
              <Tooltip title={result.seatsleft_text}>
                <Badge count={result.seatsleft}
                  style={{ backgroundColor: '#52c41a' }}>
                </Badge>
              </Tooltip>
            }
          </>
        }
        style={{ maxWidth: 330, textAlign: 'left',
          border: booked ? '2px solid #c0ffa7' : '1px solid #f0f0f0'
        }}
        actions={[
          <Tooltip title={
            account ? (
              accinfo ? (
                booked ? (
                  trigger ? (
                    "Trigger set for " + triggerdate
                    ) : "You are booked in ✓"
                  )
                  : (
                    force || result.registration_enabled ? "Book in now" : (
                      fully_booked ? "Full" : "Book in when reservations open"
                      )
                    )   
              )
              : 'Fill in account info first.'
            ) : 'Login first'
            }>
            <Button
              type="default"
              icon={booked ? 
                    (trigger ? <BellOutlined key="trigger" /> :
                      <CheckOutlined key="booked" />)
                  :
                (force || result.registration_enabled ?
                <EditOutlined key="edit" /> :
                <BellOutlined key="schedule" />)}
              onClick={() => this.props.planReservering(result)}
              disabled={!force && (!account || fully_booked || booked || !accinfo)}
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
        <p>
          <Tag>
            {moment(result.startdt).format('HH:mm:ss')}
          </Tag>
          <span>→ </span>
          <Tag>
            {moment(result.enddt).format('HH:mm:ss')}
          </Tag>
        </p>
        @ {result.location} <Tooltip 
            title={result.title}
          >
            <InfoCircleOutlined />
          </Tooltip>
      </Card>
    )
  }
}