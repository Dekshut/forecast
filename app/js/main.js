window.addEventListener('DOMContentLoaded', () => {

  const slider = document.querySelector('.days__list'),
    inputCitySearch = document.querySelector('.header__search-input');

  document.body.onload = function () {
    setTimeout(() => {
      const preloader = document.getElementById('page-preloader');
      if (!preloader.classList.contains('done')) {
        preloader.classList.add('done');
      }
    }, 1000);
  };

  getDataByAPI('q=new york');
  showMyLocalWeather();
  setCity();

  function showMyLocalWeather() {
    const findMeBtn = document.querySelector('.header__btn-find'),
      errorMessage = document.querySelector('.header__btn-message');

    findMeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        getDataByAPI(`lat=${lat}&lon=${lon}`);
      }

      function error() {
        errorMessage.innerHTML = '';
        errorMessage.innerHTML = 'Allow your browser to use Geolocation!';
        findMeBtn.classList.add('header__btn-find--disable');
      }

      if (!navigator.geolocation) {
        errorMessage.innerHTML = '';
        errorMessage.innerHTML = 'Geolocation is not supported by your browser!';
        findMeBtn.classList.add('header__btn-find--disable');
      } else {
        navigator.geolocation.getCurrentPosition(success, error);
      }
    });
  }

  function getDataByAPI(geolocation) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${geolocation}&units=metric&appid=2ff7101797c23184370edad451537041`)
      .then(resp => resp.json())
      .then(async data => {

        if (data.message == 'city not found') {
          inputCitySearch.value = '';
          inputCitySearch.placeholder = 'incorrect city!';
          return;
        }

        inputCitySearch.placeholder = 'Search city';
        inputCitySearch.value = '';
        timeBuilding(data, 0);
        sunDataBuilding(data, 0);
        addressBuilding(data);
        currentDateBuilding(data);

        try {
          let resp = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${data.city.coord.lat}&lon=${data.city.coord.lon}&exclude=current,minutely,hourly,alerts&units=metric&appid=2ff7101797c23184370edad451537041`);

          let user = await resp.json();
          dayBuilding(user);
          startSlider();
          sliderToggler(data);
        } catch {
          document.location = 'error.html';
        }
      });
  }

  function startSlider() {
    $(slider).slick({
      slidesToShow: 3,
      infinite: false,
      dots: true,
      responsive: [
        {
          breakpoint: 750,
          settings: {
            slidesToShow: 2,
          }
        },
        {
          breakpoint: 620,
          settings: {
            slidesToShow: 2,
            arrows: false
          }
        },
        {
          breakpoint: 520,
          settings: {
            slidesToShow: 1,
            arrows: false
          }
        }
      ]
    });
  }

  function sliderToggler(data) {
    const sliderItems = document.querySelectorAll('.days__item');
    sliderItems.forEach((element, i) => {
      element.addEventListener('click', () => {
        sliderItems.forEach(item => {
          item.classList.remove('days__item--cheked');
        });
        element.classList.add('days__item--cheked');
        sunDataBuilding(data, i);
        timeBuilding(data, i);
      });
    });
  }

  function getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  function getMonthName(monthNumber) {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return months[monthNumber];
  }

  function currentDateBuilding(data) {
    const currentTime = new Date();
    currentTime.setMilliseconds(currentTime.getMilliseconds() + data.city.timezone * 1000);
    time = document.querySelector('.header__current-time');
    date = document.querySelector('.header__current-data');
    time.innerHTML = `${hoursToString(currentTime.getUTCHours())}:${minutesToString(currentTime.getUTCMinutes())} ${getTimeDescr(currentTime.getUTCHours(), currentTime.getUTCMinutes())}`;
    date.innerHTML = `${getDayName(currentTime.getUTCDay())}, ${currentTime.getUTCDate()}
  ${getMonthName(currentTime.getUTCMonth())}, ${currentTime.getUTCFullYear()}`;
  }

  function addressBuilding(data) {
    const flag = document.createElement('img'),
      address = document.querySelector('.header__city-name');

    flag.classList.add('header__city-flag');
    address.innerHTML = `${data.city.name}, ${data.city.country}`;
    flag.src = `images/icon/flags/${data.city.country.toLowerCase()}.svg`;
    address.prepend(flag);
  }

  function sunDataBuilding(data, i) {
    const sunDate = document.querySelector('.content__day'),
      sunriseItem = document.querySelector('.content__sun-descr--sunrise'),
      sunsetItem = document.querySelector('.content__sun-descr--sunset'),
      sunrise = new Date(data.city.sunrise * 1000 + data.city.timezone * 1000),
      sunset = new Date(data.city.sunset * 1000 + data.city.timezone * 1000),
      dateTime = new Date(data.list[0].dt * 1000 + data.city.timezone * 1000 + i * 86400000);

    sunriseItem.innerHTML = `${hoursToString(sunrise.getUTCHours())}:${minutesToString(sunrise.getUTCMinutes())} AM`;
    sunsetItem.innerHTML = `${hoursToString(sunset.getUTCHours())}:${minutesToString(sunset.getUTCMinutes())} PM`;
    sunDate.innerHTML = `${dateTime.getUTCDate()} ${getMonthName(dateTime.getUTCMonth())}`;
  }

  function timeBuilding(data, i) {
    const contentItems = document.querySelector('.content__items'),
      dateTime = new Date(data.list[0].dt * 1000 + data.city.timezone * 1000 + i * 86400000);
    contentItems.innerHTML = '';

    data.list.forEach(element => {
      const time = new Date(element.dt * 1000 + data.city.timezone * 1000);

      if (dateTime.getUTCDate() == time.getUTCDate() ||
        dateTime.getUTCDate() == time.getUTCDate() - 1 && time.getUTCHours() == 0) {
        const item = document.createElement('div');
        item.classList.add('content__item');

        if (element.sys.pod == 'n') item.classList.add('content__item--night');

        item.innerHTML =
          `<div class="content__item-time">${hoursToString(time.getUTCHours()) + ':00'}</div>
      <img class="content__item-img" src="images/icon/weather/${element.weather[0].icon}.png"></img>
      <div class="content__item-temp">${Math.round(element.main.temp)}°</div>
      <div class="content__item-descr">${element.weather[0].description}</div>
      <div class='content__item-box'>
        <img class="content__item-direction" src="images/icon/direction.png" 
        style="transform: rotate(${element.wind.deg}deg);">
        <div class="content__item-wind">${getWindDirection(element.wind.deg)},
        ${Math.round(element.wind.speed * 10) / 10} m/s</div>
        <div class="content__item-hum">${Math.round(element.main.humidity)}%</div>
        <div class="content__item-pressure">${Math.round(element.main.pressure)}hPa</div>
      </div >`;

        contentItems.append(item);
      }
    });

    function getWindDirection(angle) {
      if (angle >= 0 && angle <= 22.5 || angle > 337.5 && angle <= 360) return 'N';
      else if (angle > 22.5 && angle <= 67.5) return 'NE';
      else if (angle > 67.5 && angle <= 112.5) return 'E';
      else if (angle > 112.5 && angle <= 175.5) return 'SE';
      else if (angle > 175.5 && angle <= 202.5) return 'S';
      else if (angle > 202.5 && angle <= 247.5) return 'WS';
      else if (angle > 247.5 && angle <= 292.5) return 'W';
      else if (angle > 292.5 && angle <= 337.5) return 'NW';
    }
  }

  function hoursToString(hours) {
    if (hours < 10) return `0${hours}`;
    return hours;
  }

  function minutesToString(minutes) {
    if (minutes < 10) return `0${minutes}`;
    return minutes;
  }

  function getTimeDescr(hours, minutes) {
    if (hours >= 12 && minutes >= 0) return 'PM';
    return 'AM';
  }

  function dayBuilding(data) {
    slider.innerHTML = '';
    slider.classList.remove('slick-slide', 'slick-initialized');

    data.daily.forEach((element, i) => {
      let date = new Date(element.dt * 1000 + data.timezone_offset * 1000);

      const item = document.createElement('div');
      item.classList.add('days__item');
      item.innerHTML =
        `<div class="days__item-imgbox">
        <img class="days__item-img" src="images/icon/weather/${element.weather[0].icon}.png" alt="">
      </div>
      <div class="days__item-text">${getDayName(date.getUTCDay())}, ${date.getUTCDate()} 
      ${getMonthName(date.getUTCMonth())}</div>
      <div class="days__item-temp">${Math.round(element.temp.day)}°</div>
      <div class="days__item-descr">${element.weather[0].description}</div>
      <div class="days__item-box">
        <div class="days__item-wind">
          <div class="days__item-icon--wind"></div>
          Wind
          <span>|</span>
          <div class="days__item-data">${Math.round(element.wind_speed * 10) / 10} m/s</div>
        </div>
        <div class="days__item-hum">
          <div class="days__item-icon--hum"></div>
          Hum
          <span>|</span>
          <div class="days__item-data">${Math.round(element.humidity)} %</div>
        </div>
      </div>`;

      if (i == 0) {
        item.classList.add('days__item--cheked');
      }

      if (i <= 4) {
        slider.append(item);
      }
    });
  }

  function setCity() {
    const btnCitySearch = document.querySelector('.header__search-button');

    btnCitySearch.addEventListener('click', (e) => {
      e.preventDefault();
      getDataByAPI(`q=${inputCitySearch.value}`);
    });
  }
});


















