import React, { Component } from "react";
import {
  Platform,
  View,
  ScrollView,
  Text,
  StatusBar,
  SafeAreaView,
  Image,
  TouchableOpacity
} from "react-native";
import {
  Container,
  Button,
  Icon,
  Header,
  Left,
  Body,
  Right
} from "native-base";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { sliderWidth, itemWidth } from "../styles/SliderEntry.style";
import SliderEntry from "../components/SliderEntry";
import styles, { colors } from "../styles/index.style";
import { ENTRIES1, ENTRIES2 } from "../static/entries";
import { scrollInterpolators, animatedStyles } from "../utils/animations";
// utils
import Colors from "../utils/Colors";
import GLOBAL_PARAMS from "../utils/global_params";
import ToastUtil from "../utils/ToastUtil";
//api
import api from "../api";
//components
import CommonHeader from "../components/CommonHeader";
import ErrorPage from "../components/ErrorPage";
import Loading from "../components/Loading";
//language
import i18n from "../language/i18n";

const IS_ANDROID = Platform.OS === "android";
const SLIDER_1_FIRST_ITEM = 1;

export default class ShopSwiperablePage extends Component {
  _current_offset = 0;

  constructor(props) {
    super(props);
    this.state = {
      slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
      shopDetail: null,
      foodDetails: null,
      isError: false,
      loading: true,
      i18n: i18n[this.props.screenProps.language]
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      i18n: i18n[nextProps.screenProps.language]
    });
  }

  componentDidMount() {
    this._current_offset = 0;
    this._getRecomendFoodList();
  }
  //api
  _getRecomendFoodList = () => {
    api.getFoodRecommend(this.props.screenProps.sid).then(
      data => {
        if (data.status === 200 && data.data.ro.ok) {
          // if (data.data.data.length === 0) {
          //     ToastUtil.showWithMessage('沒有更多數據了...');
          //     this.setState({
          //         loading: false
          //     })
          //     return;
          // }
          this.setState({
            foodDetails: data.data.data,
            loading: false
          });
        }
      },
      () => {
        this.setState({ isError: true, loading: false });
      }
    );
  };

  _onErrorToRetry = () => {
    this.setState({
      loading: true,
      isError: false
    });
    this._getRecomendFoodList();
  };

  _refresh = () => {
    this._current_offset += 15;
    this.setState({
      loading: true
    });
    this.getRecommendList();
  };

  _renderItem({ item, index }) {
    return (
      <SliderEntry
        data={item}
        even={(index + 1) % 2 === 0}
        {...this["props"]}
      />
    );
  }

  _renderItemWithParallax({ item, index }, parallaxProps) {
    return (
      <SliderEntry
        data={item}
        even={(index + 1) % 2 === 0}
        // parallax={true}
        // parallaxProps={parallaxProps}
      />
    );
  }

  _renderLightItem({ item, index }) {
    return <SliderEntry data={item} even={false} {...this["props"]} />;
  }

  _renderDarkItem({ item, index }) {
    return <SliderEntry data={item} even={true} {...this["props"]} />;
  }

  mainExample(number, title) {
    const { slider1ActiveSlide } = this.state;

    return this.state.foodDetails !== null ? (
      <View style={[styles.exampleContainer, { marginTop: -15 }]}>
        {/*<Text style={[styles.title,{color:'#1a1917'}]}>商家列表</Text>*/}
        <Text style={[styles.subtitle, { color: "#1a1917" }]}>{title}</Text>
        <Carousel
          ref={c => (this._slider1Ref = c)}
          data={this.state.foodDetails}
          renderItem={this._renderItemWithParallax}
          sliderWidth={sliderWidth}
          itemWidth={itemWidth}
          hasParallaxImages={false}
          firstItem={SLIDER_1_FIRST_ITEM}
          inactiveSlideScale={0.94}
          inactiveSlideOpacity={0.7}
          // inactiveSlideShift={20}
          containerCustomStyle={styles.slider}
          contentContainerCustomStyle={styles.sliderContentContainer}
          loop={true}
          loopClonesPerSide={2}
          autoplay={true}
          autoplayDelay={3000}
          autoplayInterval={4000}
          onSnapToItem={index => this.setState({ slider1ActiveSlide: index })}
        />
      </View>
    ) : null;
  }

  render() {
    const example1 = this.mainExample(
      1,
      `- ${this.state.i18n.recommend_text} -`
    );

    return (
      <Container>
        <Header
          style={{
            backgroundColor: this.props.screenProps.theme,
            borderBottomWidth: 0
          }}
          iosBarStyle="light-content"
        >
          <Left>
            <Icon
              onPress={() => this.props.navigation.navigate("DrawerOpen")}
              name="md-apps"
              size={20}
              style={{ color: "#fff" }}
            />
          </Left>
          <Body>
            <Text style={{ color: Colors.main_white, fontSize: 16 }}>
              {this.state.i18n.takeout_title}
            </Text>
          </Body>
          <Right />
        </Header>

        {this.state.isError ? (
          <ErrorPage
            errorToDo={this._onErrorToRetry}
            errorTips="加載失败,請點擊重試"
          />
        ) : null}
        {this.state.loading ? <Loading message="玩命加載中..." /> : null}
        <ScrollView
          style={styles.scrollview}
          scrollEventThrottle={200}
          directionalLockEnabled={true}
        >
          {example1}
          {/*<View style={{height:GLOBAL_PARAMS._winHeight*0.15,flexDirection:'row',backgroundColor:this.props.screenProps.theme}}>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'dislike'}}/>
                          </TouchableOpacity>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'like'}}/>
                          </TouchableOpacity>
                        </View>*/}
          <Button
            transparent
            style={{ alignSelf: "center", flexDirection: "row" }}
            onPress={() => this._refresh()}
          >
            {/*<Icon*/}
            {/*name="md-refresh"*/}
            {/*style={{fontSize: 40, color: this.props.screenProps.theme}}*/}
            {/*/>*/}
            {/*<Text style={{fontSize: 20, color: this.props.screenProps.theme}}>*/}
            {/*換一批*/}
            {/*</Text>*/}
          </Button>
        </ScrollView>
      </Container>
    );
  }
}
