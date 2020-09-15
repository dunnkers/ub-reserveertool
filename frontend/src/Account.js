import { UserOutlined,
    LogoutOutlined,
    UserAddOutlined,
    LoginOutlined } from '@ant-design/icons';
import { Dropdown, Avatar, Button, Input, Menu, message, Form, Modal } from 'antd';
import React from 'react';
import { constructPostForm } from './util'; 

export default class Account extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const email = localStorage.getItem('email');
        if (email) this.identify(email);
    }

    identify(email) {
        return fetch('http://35.228.177.55:3001/identify/', constructPostForm({email}))
        .then(response => response.json())
        .then(result => {
            if (result) {
                message.success('Logged into '+email);
                localStorage.setItem('email', email);
                const accinfo = { account:result, email };
                this.setState(accinfo);
                this.props.setAccount(accinfo);
            } else message.warn('Invalid login for '+email)
            return result;
        })
        .catch (error => console.log('Request failed', error))
        .then(() => this.props.setReservations());
    }
    
    login(email) {
        return this.identify(email).then(() => this.setState({
            loginVisible: false
        }));
    }

    registerAccount(user) {
        this.setState({registerLoading: true})
        return fetch('http://35.228.177.55:3001/register_account/', constructPostForm(user))
        .then(response => response.json())
        .then(result => {
        this.setState({registerLoading:false, registerVisible: false });
        return this.identify(user['formData[email]']);
        })
        .catch (error => console.log('Request failed', error));   
    }

    handleClick = e => {
        console.log('click ', e);
        switch (e.key) {
        case 'logout':
            localStorage.removeItem('email');
            this.setState({account:null})
            message.success('Logged out');
            break;
        case 'login':
            this.setState({loginVisible: true})
            break;
        case 'register_account':
            this.setState({registerVisible: true})
            break;
        default:
            console.warn('no action');
            break;
        }
    }

    render() {
        return (
        <div>
            <Dropdown overlay={
              <Menu onClick={this.handleClick}>
                {this.state.account && 
                  <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="register_account" icon={<UserAddOutlined />}>Register</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="login" icon={<LoginOutlined />}>Login</Menu.Item>}
              </Menu>
            } trigger={['click']}>
              <Button type='primary' icon={<Avatar size="small" icon={<UserOutlined />} />}
                style={{background: 'none', border: 'none'}}>
                {this.state.account ? 
                  <>&nbsp;{this.state.account.fname}&nbsp;{this.state.account.lname}</>
                  : <></>}
              </Button>
            </Dropdown>
            <Modal title="Login" visible={this.state.loginVisible}
              onCancel={() => this.setState({ loginVisible: false })}
              footer={[]}>
              <Input prefix={<UserOutlined />} placeholder="RUG email"
                onPressEnter={(e) => this.login(e.target.value)}
                style={{width: 250}} />
            </Modal>
            <Modal title="Register" visible={this.state.registerVisible}
              onCancel={() => this.setState({ registerVisible: false })}
              footer={[]} onOk={(user) => this.registerAccount(user)}>
              <Form name="registration" onFinish={(user) => {
                this.registerAccount(user)
              }}>
                <Form.Item name={['formData[fname]']} label="First Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[lname]']} label="Last Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[email]']} label="Email" rules={[{ type: 'email', required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[phone]']} label="Phone Number" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[q1]']} label="S- or P-number" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={
                    this.state.registerLoading
                  }>
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
        </div>
        );
    }
}