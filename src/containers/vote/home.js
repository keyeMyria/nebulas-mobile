import React, { Component } from 'react';
import { List, InputItem, WhiteSpace,
  TextareaItem, DatePicker, Button, WingBlank,
	Toast, ActivityIndicator
} from 'antd-mobile';
import { createForm } from 'rc-form';
import NebPay from 'nebpay.js';
import Nebulas from 'nebulas';
import './style.css';
import addIcon from '../../assets/Add.svg';
import reduceIcon from '../../assets/reduce.svg';
import logo from '../../assets/vote.png';
const nowTimeStamp = Date.now();
const now = new Date(nowTimeStamp);

const neb = new Nebulas.Neb();
const nebPay = new NebPay();

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 'redTab',
      hidden: false,
      fullScreen: true,
      date: now,
	    optionList: ['option1', 'option2'],
	    animating: false,
	    message: '',
    };

    this.net = 'https://mainnet.nebulas.io';
    this.dappAddress='n1mayin5cM5Tkm7itSLtLHS6UjNHXzpK6fE';
	  this.pending = false;
	  this.timeout = 0;
  }

  componentDidMount() {
	  this.switchNet(this.net);
  }

	switchNet = (value) => {
		neb.setRequest(new Nebulas.HttpRequest(value));
	}

  handleClick = () => {
    this.inputRef.focus();
  }

	addInput = () => {
    const { optionList } = this.state;
    const len = +optionList[optionList.length - 1].substr(-1, 1);
    const addOption = `option${len + 1}`;
    const newOptions = optionList.concat(addOption);
    this.setState({optionList: newOptions});
  }

	handleReduceOption = (item) => {
  	console.log(item)
		const { optionList } = this.state;
		if (optionList.length === 2) {
			Toast.info('投票至少需要两个选项!', 1);
    }
		const newOptions = optionList.filter(option => item !== option);
		this.setState({optionList: newOptions});
  }

	handleSubmit = () => {
  	const { optionList, date } = this.state;
		this.props.form.validateFields((error, values) => {
			console.log(error, values);
			if (!error) {
				const optionArr = optionList.map(item => ({
					option: values[item],
					list: []
				}));
				const {title, description} = values;
				if (optionArr.length < 2 || !title || !description) {
					Toast.fail('请输入相关信息!', 1);
					return;
				}
				const to = this.dappAddress;
				const value = '0';
				const callFunc = 'create';
				const callArgs = JSON.stringify([title, description || '', date, optionArr]);
				this.serialNumber = nebPay.call(to, value, callFunc, callArgs, {
					listener: this.cbPush
				});
				this.queryTimer = setInterval(() => {
					this.queryInterval();
				}, 10000);
			}
		});
  }

	cbPush = (res) => {
		const resObj = res;
		console.log(`res of push:${JSON.stringify(res)}`);
		const hash = resObj.txhash;
		if (!hash) {
			this.toggleToast(false, '');
			Toast.fail('取消交易!!', 1);
			clearInterval(this.queryTimer);
		}
	}

	queryInterval () {
  	if (!this.serialNumber) return;
		if(!this.pending) {
			this.toggleToast(true, '正在查询交易，请等待！');
		}
		// if (this.timeout > 1) {
		// 	this.toggleToast(false, '');
		// 	Toast.fail('取消交易!!', 1);
		// 	clearInterval(this.queryTimer);
		// }
		this.pending = true;
		nebPay.queryPayInfo(this.serialNumber)
			.then(res => {
				console.log(`tx result: ${res}`);
				const resObj = JSON.parse(res);
				console.log('serialNumber', resObj);
				if (resObj.code === 0 && resObj.data.status === 1) {
					Toast.success('操作成功 !!!', 1);
					this.pending = false;
					this.toggleToast(false, '');
					clearInterval(this.queryTimer);
					this.props.getVoteList();
					this.props.form.resetFields();
				}
				if (resObj.code === 1) {
					this.timeout += 1;
				}
			})
			.catch(function (err) {
				console.log('err', err);
				clearInterval(this.queryTimer);
			});
	}

	toggleToast = (animating, message) => {
		this.setState({ animating, message});
	}

  render() {
    const { getFieldProps } = this.props.form;
    const {optionList, message} = this.state;
    return (
          <div>
	          <WhiteSpace />
	          <WingBlank>
		          <div style={{display: 'flex'}}>
			          <img src={logo} alt="" className="logo"/>
			          <h3 style={{marginLeft: '10px'}}>NAS轻投票</h3>
		          </div>
	          </WingBlank>
	          <WhiteSpace />
	          <ActivityIndicator
		          toast
		          text={message || 'Loading...'}
		          animating={this.state.animating}
	          />
            <List renderHeader={() => '新建投票'}>
              <InputItem
                {...getFieldProps('title')}
                clear
                placeholder="请输入"
              >投票标题</InputItem>
              <TextareaItem
                {...getFieldProps('description')}
                title="补充描述"
                placeholder="选填"
                autoHeight
              />
            </List>

            <List renderHeader={() => '选项'}>
              {
	              optionList.map(item => {
	                return <InputItem
                    key={item}
		                {...getFieldProps(item)}
		                placeholder="选项"
	                >
		                <div style={{
			                width: '22px',
			                height: '22px',
			                background: `url(${reduceIcon}) center center /  21px 21px no-repeat` }}
                         onClick={() => this.handleReduceOption(item)}
		                />
                  </InputItem>
                })
              }
	            <WingBlank>
		            <div className='addSelect' onClick={this.addInput}>
			            <div style={{
				            width: '22px',
				            height: '22px',
				            background: `url(${addIcon}) center center /  21px 21px no-repeat` }}
			            />
                  <span style={{
	                  marginLeft: '5px'}}>添加选项</span>
                </div>
              </WingBlank>
            </List>

            <WhiteSpace />

            <List className="date-picker-list" style={{ backgroundColor: 'white' }}>
                <DatePicker
                value={this.state.date}
                onChange={date => this.setState({ date })}
                >
                <List.Item arrow="horizontal">截止时间</List.Item>
                </DatePicker>
            </List>

            <WhiteSpace />

            <WingBlank>
                <Button type="primary" onClick={this.handleSubmit}>提交</Button>
            </WingBlank>
          </div>
    );
  }
}

export default createForm()(Home);