import React, { PureComponent } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Animated,
  Easing
} from "react-native";
import { Container, Header } from "native-base";
import { connect } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import FastImage from "react-native-fast-image";
import Antd from "react-native-vector-icons/AntDesign";
import {PopoverPicker} from 'teaset';
//actions
import { SHOW_AD, HIDE_AD } from "../actions";
//utils
import GLOBAL_PARAMS, { em, isEmpty } from "../utils/global_params";
import JSONUtils from "../utils/JSONUtils";
import { getDeviceId } from "../utils/DeviceInfo";
//api
import { getNewArticleList, adSpace } from "../api/request";
import source from "../api/CancelToken";
//components
import Text from "../components/UnScalingText";
import WarningTips from "../components/WarningTips";
import CommonFlatList from "../components/CommonFlatList";
import AdvertiseView from "../components/AdvertiseView";
import PlacePickerModel from "../components/PlacePickerModel";
import ShimmerPlaceHolder from "../components/ShimmerPlaceholder";
import CustomizeContainer from "../components/CustomizeContainer";
//styles
import FoodDetailsStyles from "../styles/fooddetails.style";
//storage
import { advertisementStorage } from "../cache/appStorage";
import Divider from "../components/Divider";

const {
  isIphoneX,
  bottomDistance,
  iPhoneXBottom,
  _winHeight,
  _winWidth
} = GLOBAL_PARAMS;

const HAS_FOODS = 1;
const NO_MORE_FOODS = 2;
const IS_INTERCEPT = 3;

let lastBackPressed = Date.now();

class FoodListView extends PureComponent {
  _interval = null;
  _isFirstReload = null;
  constructor(props) {
    super(props);
    this._interval = null;
    this._isFirstReload = true; //判断是否为首次加载
    // Platform.OS == 'android' && BackHandler.addEventListener('hardareBackPress', this.onBackButtonPressAndroid.bind(this));
    this.state = {
      currentItem: "",
      placeSelected: null,
      advertiseImg: "",
      advertiseData: null,
      advertiseCountdown: 5,
      warningTipsData: [],
      star: null,
      listDataLength: 0,
      isAdvertiseShow: false,
      isWarningTipShow: true,
      searchBarOpacity: new Animated.Value(1), 
      warningTipsScale: new Animated.Value(1),
      searchBtnShow: false,
    };
  }

  componentWillMount() {
    let { isAdShow, hideAd } = this.props;
    if (isAdShow) {
      hideAd();
    }
    advertisementStorage.getData((error, data) => {
      if (error == null) {
        if (data != null) {
          isAdShow &&
            this.setState({
              advertiseImg: data.image,
              advertiseData: data,
              isAdvertiseShow: true
            });
          this._advertiseInterval();
        }
        this._getAdvertise(data);
      }
    });
  }

  componentWillUnmount() {
    source.cancel();
    // BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid.bind(this));
    // clearInterval(this._interval);
  }

  //logic functions

  onBackButtonPressAndroid() {
    if(lastBackPressed && lastBackPressed + 2000 >= Date.now()) {
      BackHandler.exitApp()
    }
    lastBackPressed = Date.now();
    ToastAndroid.show("再按一次退出app", ToastAndroid.SHORT);
    return true;
  }

  _getAdvertise(old_data) {
    adSpace()
      .then(data => {
        if (data.ro.respCode == "0000") {
          if (data.data.length == 0) {
            // 如果data为空，则不设置缓存为空
            advertisementStorage.setData(null);
            return;
          }
          if (old_data != null) {
            // 如果缓存不为空
            if (JSONUtils.jsonDeepCompare(old_data, data.data[0])) {
              return; // 判断缓存是否与服务器数据相等，如果相等则不做操作
            } else {
              // 如果缓存不等则覆盖本地缓存为服务器数据
              advertisementStorage.setData(data.data[0]);
              Image.prefetch(data.data[0].image);
            }
          } else {
            // 如果缓存为空，则缓存到本地
            advertisementStorage.setData(data.data[0]);
            Image.prefetch(data.data[0].image);
          }
        }
      })
      .catch(err => {
        if (axios.isCancel(thrown)) {
          // console.log('Request canceled', thrown.message);
        }
      });
  }

  _advertiseInterval() {
    this._interval = setInterval(() => {
      if (this.state.advertiseCountdown > 1) {
        this.setState({
          advertiseCountdown: this.state.advertiseCountdown - 1
        });
      } else {
        this.setState({
          isAdvertiseShow: false
        });
        clearInterval(this._interval);
      }
    }, 1000);
  }

  _initMenuStatus() {
    this.setState({
      searchBtnShow: false,
      isWarningTipShow: true,
    });
    this.state.searchBarOpacity.setValue(1);
    this.state.warningTipsScale.setValue(1);
  }

  _getSeletedValue(val) {
    if (val == null) {
      // this._picker.getPlace();
      this.setState({ isError: true, loading: false });
      return;
    }
    if(!!this.state.placeSelected && val.name == this.state.placeSelected.name) {
      return;
    }
    this.setState(
      {
        placeSelected: val
      },
      () => {
        if (!this._isFirstReload) {
          if (!!this.flatlist) {
            this.flatlist.outSideRefresh();
            this._initMenuStatus();
          };
          this._isFirstReload = false;
        } else {
          this._isFirstReload = false;
        }
      }
    );
  }

  _getScrollTop(scrollTop) {
    console.log('scrollTop', scrollTop);
    if(scrollTop <= 0) {
      this._initMenuStatus();
    }
    if(scrollTop > em(50)) {
      this.setState({
        searchBtnShow: scrollTop > em(100)
      });
      this.setState({
        isWarningTipShow: scrollTop < em(100)
      })
      // if(Platform.OS == 'ios') {
        Animated.parallel(['searchBarOpacity', 'warningTipsScale'].map(property => {
          return Animated.spring(this.state[property], {
            toValue: 1 - scrollTop / em(100) < 0 ? 0 : (1 - scrollTop / em(100)),
            duration: 300,
            easing: Easing.linear
          })
        })).start();
      // }
    } else {
      // if(Platform.OS == 'ios') {
        Animated.parallel(['searchBarOpacity', 'warningTipsScale'].map(property => {
          return Animated.spring(this.state[property], {
            toValue: 1,
            duration: 300,
            easing: Easing.linear
          })
        })).start();
      // }
    }
  }

  //render functions
  _renderAdvertisementView() {
    return (
      <AdvertiseView
        modalVisible={this.state.isAdvertiseShow}
        seconds={this.state.advertiseCountdown}
        image={this.state.advertiseImg}
        data={this.state.advertiseData}
        countDown={this.state.advertiseCountdown}
        closeFunc={() =>
          this.setState({
            isAdvertiseShow: false
          })
        }
        {...this.props}
      />
    );
  }

  _renderRefreshBgView() {
    return (
      <LinearGradient
        colors={["#FF7F0B", "#FF1A1A"]}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 0.0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: _winHeight*0.6,
          width: _winWidth,
          overflow: "hidden"
        }}
      />
    );
  }

  _renderTopTitleView() {
    return (
      <LinearGradient
        colors={["#FF7F0B", "#FF1A1A"]}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 0.0 }}
        style={{
          paddingTop: em(10),
          paddingBottom: em(10),
          paddingLeft: em(15),
          paddingRight: em(15),
          justifyContent: "space-between",
          flexDirection: "row",
          position: "relative"
        }}
      >
        <Text style={[FoodDetailsStyles.DateFormatWeekText, { color: "#fff" }]}>
          {this.props.i18n.foodlist_tips.title}
        </Text>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {this.props.i18n.foodlist_tips.sub_title}:{this.state.star}/5
        </Text>
      </LinearGradient>
    );
  }

  _renderWarningView() {
    return (
      <Animated.View style={{height: this.state.warningTipsScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 40]
      })}}>
        <WarningTips {...this.props} />
      </Animated.View>
    )
  }

  _renderHeaderView() {
    let { placeSelected } = this.state;
    let { navigate } = this.props.navigation;
    let scheme = "";
    if (placeSelected != null) {
      let {
        placeSelected: { lon, lat, name }
      } = this.state;
      scheme = Platform.select({
        android: `geo:${lon},${lat}?q=${name}`,
        ios: `http://maps.apple.com/?q=${name}&ll=${lon},${lat}`
      });
    }
    const menuElement = title => (<Text style={{padding: em(5)}}>{title}</Text>)
    return (
      <Header
        style={FoodDetailsStyles.Header}
        iosBarStyle="light-content"
        androidStatusBarColor="transparent"
      >
        <LinearGradient
          colors={["#FF7F0B", "#FF1A1A"]}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 0.0 }}
          style={FoodDetailsStyles.linearGradient}
        >
          <TouchableOpacity
            onPress={() => navigate("DrawerOpen", { callback: this._add })}
            style={FoodDetailsStyles.MenuBtn}
          >
            <Antd name="menu-fold" style={FoodDetailsStyles.MenuImage} />
            {/* <Image
              source={require("../asset/menu.png")}
              style={FoodDetailsStyles.MenuImage}
              resizeMode="contain"
            /> */}
          </TouchableOpacity>
          {this.state.searchBtnShow ? <View style={[FoodDetailsStyles.HeaderContent, ]}><Text style={{color: '#fff', fontSize: em(18),fontWeight: 'bold',marginRight: em(-52)}}>精選菜品</Text></View> :
          <Animated.View style={[FoodDetailsStyles.HeaderContent,{opacity: this.state.searchBarOpacity}]}>
            {placeSelected != null ? this._renderPlacePickerBtn() : (
              <ActivityIndicator color="#fff" size="small" />
            )}
          </Animated.View>}
          <View style={{flexDirection: 'row', alignItems:'center'}}>
            {this.state.searchBtnShow && <TouchableOpacity style={[FoodDetailsStyles.MenuBtn,{marginRight: -8}]} onPress={() => this.setState({ showPlacePicker: true })}>
              <Antd name="enviromento" style={FoodDetailsStyles.moreIcon}/>
            </TouchableOpacity>} 
            <TouchableOpacity
              onPress={() =>{
                PopoverPicker.show(
                  {x: _winWidth - 135, y: -50, width:100, height:100},
                  [menuElement("查看配送點"),menuElement("兌換優惠碼"), menuElement('反饋')],
                  this.state.modalSelectedIndex,
                  (item, index) => {
                    switch(index) {
                      case 0: {
                        this.props.navigation.navigate('PickPlace', {
                          navigate: true
                        });break;
                      }
                      case 1: {
                        this.props.navigation.navigate('Coupon', {
                          navigate: true
                        });break;
                      }
                      case 2: {
                        this.props.navigation.navigate('Feedback', {
                          navigate: true
                        });break;
                      }
                    }
                  },
                  {modal: false}
                );
              }}
              style={FoodDetailsStyles.MenuBtn}
            >
              {/* <Image
                source={require("../asset/location_white.png")}
                style={FoodDetailsStyles.locationImage}
                resizeMode="contain"
              /> */}
              <Antd name="appstore-o" style={FoodDetailsStyles.moreIcon}/>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Header>
    );
  }

  _renderPlacePickerBtn() {
    return (
      <TouchableOpacity
        style={FoodDetailsStyles.PlacePickerBtn}
        onPress={() => this.setState({ showPlacePicker: true })}
      >
        <View style={FoodDetailsStyles.PlacePickerBtnBgAbsolute} />
        <Text style={FoodDetailsStyles.PlacePickerBtnText} numberOfLines={1}>
          {this.state.placeSelected.name}
        </Text>
        <Image
          source={require("../asset/arrow_down.png")}
          style={FoodDetailsStyles.PlacePickerBtnImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }

  _renderPlacePicker() {
    let { showPlacePicker } = this.state;
    return (
      <PlacePickerModel
        ref={c => (this._picker = c)}
        modalVisible={showPlacePicker}
        closeFunc={() => this.setState({ showPlacePicker: false })}
        getSeletedValue={val => this._getSeletedValue(val)}
        {...this.props}
      />
    );
  }

  _renderIndicator() {
    return (
      <Divider height={1} bgColor="#ccc"/>
    )
  }

  _renderFoodListItemView(item, index) {
    if (typeof item === "undefined") return;
    let _device = getDeviceId().split(",")[0];
    return (
      <TouchableOpacity
        style={[
          styles.articleItemContainer,
          index == 0 && {
            borderTopRightRadius: 8,
            borderTopLeftRadius: 8,
          }
        ]}
        onPress={() => {
          this.props.navigation.navigate("Food", {
            dateFoodId: item.dateFoodId
          });
        }}
        activeOpacity={1}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          borderRadius={10}
          style={{
            width: _winWidth * 0.45 - 10,
            height: em(155),
            alignSelf: "center",
            borderRadius: 10
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
        {/* <Image
          source={{ uri: item.thumbnail }}
          style={{ width: _winWidth * 0.45 - 10, height: em(170) }}
          resizeMode="cover"
        /> */}
        <View style={styles.articleItemDetails}>
          <View style={[styles.itemName, styles.marginBottom9]}>
            <Text style={styles.foodName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.foodCommonContainer}>
            <Text style={styles.foodCommon}>日期</Text>
            <Text style={styles.foodCommon}>{item.date}</Text>
          </View>
          {/* <View style={styles.foodCommonContainer}>
            <Text style={styles.foodCommon}>餐廳</Text>
            <Text style={styles.foodCommon}>{item.canteenName}</Text>
          </View> */}
          <View style={styles.foodCommonContainer}>
            <Text style={styles.foodCommon}>套餐價</Text>
            <Text
              style={[
                styles.foodCommon,
                item.originPrice
                  ? {
                      textDecorationLine: "line-through",
                      textDecorationColor: "#666"
                    }
                  : {}
              ]}
            >
              {item.originPrice
                ? `HKD${parseFloat(item.originPrice).toFixed(2)}`
                : "市價"}
            </Text>
          </View>
          <View>
            <Text style={styles.foodBrief}>成分: {item.component || ""}</Text>
          </View>
          <View style={styles.foodCommonContainer}>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.foodUnit}>HKD</Text>
              <Text style={styles.foodPrice}>{item.price}</Text>
            </View>
            <Text
              style={{
                color: "#ff5858",
                fontSize: _winWidth < 375 ? 13 : 16,
                marginTop: Platform.OS == "android" ? -3 : 0
              }}
            >
              {
                item.status && (item.status == HAS_FOODS ? '立即預訂' : item.status == NO_MORE_FOODS ? '已售罄' : '已截單') || '立即預訂'
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  _renderFlatListView() {
    _bottomDistance = isIphoneX()
      ? bottomDistance + iPhoneXBottom
      : bottomDistance;
    const { placeSelected } = this.state;
    if (isEmpty(placeSelected)) {
      return null;
    }
    return (
      <CommonFlatList
        ref={c => (this.flatlist = c)}
        requestFunc={getNewArticleList}
        // renderIndicator={() => this._renderIndicator()}
        renderItem={(item, index) => this._renderFoodListItemView(item, index)}
        renderHeader={() => this._renderTopTitleView()}
        extraParams={{ placeId: this.state.placeSelected.id }}
        refreshControlTitleColor="#fff"
        refreshControlTintColor="#fff"
        getRawData={data => {
          this.setState({ star: data.star});
        }}
        getScrollTop={
          scrollTop => this._getScrollTop(scrollTop)
        }
        {...this.props}
      />
    );
  }

  render() {
    return (
      <CustomizeContainer.SafeView mode="linear" style={{ position: "relative", backgroundColor: "#fff" }}>
        {this._renderAdvertisementView()}
        {this.state.star && this._renderRefreshBgView()}
        {/* {this._renderIndicator()} */}
        {this._renderPlacePicker()}
        {this._renderHeaderView()}
        {this.state.isWarningTipShow && this._renderWarningView()}
        {this._renderFlatListView()}
      </CustomizeContainer.SafeView>
    );
  }
}

const foodListStateToProps = state => {
  return {
    isAdShow: state.toggleAd.isAdvertisementShow
  };
};

const foodListDispatchToProps = dispatch => ({
  showAd: () => dispatch({ type: SHOW_AD }),
  hideAd: () => dispatch({ type: HIDE_AD })
});

export default connect(
  foodListStateToProps,
  foodListDispatchToProps
)(FoodListView);

const styles = StyleSheet.create({
  articleItemContainer: {
    height: em(190),
    flex: 1,
    // paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    flexDirection: "row",
    shadowColor: "#333",
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0,
    shadowRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  articleItemDetails: {
    height: em(150),
    paddingLeft: em(10),
    // paddingRight: 0,
    flex: 1,
    backgroundColor: "#fff",
    // borderWidth: 1,
    // borderColor: '#ededeb',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    overflow: "hidden",
    justifyContent: "space-between"
  },
  itemName: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  foodCommonContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  foodName: {
    fontSize: em(18),
    color: "#111",
    fontWeight: "800"
  },
  foodCommon: {
    fontSize: em(13),
    color: "#666"
  },
  foodBrief: {
    fontSize: em(13),
    color: "#666",
    textAlign: "justify",
    lineHeight: 16
  },
  foodUnit: {
    fontSize: em(14),
    color: "#666",
    marginRight: em(3),
    marginTop: Platform.OS === "android" ? em(-3.5) : 0
  },
  foodPrice: {
    fontSize: _winWidth < 375 ? em(16) : em(18),
    color: "#2a2a2a",
    lineHeight: em(18)
  },
  marginBottom9: {
    marginBottom: em(10)
  }
});
