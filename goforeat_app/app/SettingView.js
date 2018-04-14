import React,{PureComponent} from 'react'
import {View,Text,StyleSheet,TouchableOpacity,Switch} from 'react-native'
import {Container,Body,Button,Icon,Content,ListItem,Left,Right} from 'native-base'
import {NavigationActions} from 'react-navigation'
//utils
import Colors from './utils/Colors';
import GLOBAL_PARAMS from './utils/global_params';
//components
import CommonHeader from './components/CommonHeader'

export default class SettingView extends PureComponent{
  state = {
    isEnglish: false
  }
  _currentItemClick = theme => {
    if(theme === this.props.screenProps.theme) return;
    this.props.screenProps.changeTheme(theme)
    // const resetAction = NavigationActions.reset({
    //     index: 0,
    //     actions: [
    //         NavigationActions.navigate( { routeName: 'Home',params:{refresh:123}} )
    //     ],
    // });
    // this.props.navigation.dispatch(resetAction);
  }

  componentDidMount = () => {
    console.log(this.props);
    this.setState({
      isEnglish: this.props.screenProps.isEn
    })
  }
  
  _changeLanguage = () => {
    this.setState({
      isEnglish: !this.state.isEnglish
    })
    
    this.props.screenProps.changeLanguage(!this.state.isEnglish)
    console.log(this.props);
  }

  render() {
    const _data = [
      {data: [{bgColor:Colors.main_orange,name:'橙'},
      {bgColor:Colors.main_purple,name:'紫'},
      {bgColor:Colors.main_green,name:'綠'},
      {bgColor:Colors.main_blue,name:'藍'},]},
      {data:[{bgColor:Colors.main_black,name:'暗'},
      {bgColor:Colors.main_red,name:'紅'},
      {bgColor:Colors.ionBlue,name:'鐵藍'},
      {bgColor:Colors.main_brown,name:'咖啡'},]},
      {data:[{bgColor:Colors.blue_green,name:'青綠'},
      {bgColor:Colors.deep_green,name:'深綠'},
      {bgColor:Colors.middle_red,name:'緋紅'}, 
      {bgColor:Colors.rate_yellow,name:'黃'}]}     
    ]
    return (
      <Container>
        <CommonHeader title="系統設置" canBack {...this['props']}/>
        <Content>
          <View style={styles.title}>
            <Text>選擇主題</Text>
          </View>
          {
            _data.map((item,idx) => (
              <View style={{flex: 1,flexDirection: 'row'}} key={idx}>
                {item.data.map((ditem,didx) => (
                  <TouchableOpacity key={didx} style={{height:50,backgroundColor:ditem.bgColor,
                    flex:1,justifyContent:'space-between',paddingLeft:10,paddingRight:10,
                    flexDirection:'row',alignItems:'center',width:GLOBAL_PARAMS._winWidth*0.5}}
                    onPress={() => this._currentItemClick(ditem.bgColor)}>
                    <Text style={{color:'#fff',fontSize:18}}>{ditem.name}</Text>
                    {this.props.screenProps.theme === ditem.bgColor ? (<Icon name="md-checkmark-circle" style={{fontSize:20,color:'#fff'}}/>)
                    : null }
                  </TouchableOpacity>
                ))}
              </View>
            ))
          }    
          <View style={styles.title}>
            <Text>選擇語言</Text>
          </View>
          <ListItem style={{backgroundColor: Colors.main_white,marginLeft: 0}}>
              <Body>
                <Text style={{paddingLeft:10}}>for English</Text>
              </Body>
              <Right>
                <Switch  value={this.state.isEnglish} onValueChange={(value) => this._changeLanguage()}/>
              </Right>
            </ListItem>
            <View style={styles.title}>
              <Text>清除緩存</Text>
            </View>
        </Content>
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  title: {
    height:40,
    padding:10
  }
})
