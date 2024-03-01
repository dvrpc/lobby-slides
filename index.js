if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === "function" || toStr.call(fn) === "[object Function]";
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) {
        return 0;
      }
      if (number === 0 || !isFinite(number)) {
        return number;
      }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError(
          "Array.from requires an array-like object - not null or undefined"
        );
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== "undefined") {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function"
          );
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] =
            typeof T === "undefined"
              ? mapFn(kValue, k)
              : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  })();
}

/**
 * Array.prototype.find() polyfill
 * Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!Array.prototype.find) {
  Array.prototype.find = function (callback) {
    // 1. Let O be ? ToObject(this value).
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }

    var o = Object(this);

    // 2. Let len be ? ToLength(? Get(O, "length")).
    var len = o.length >>> 0;

    // 3. If IsCallable(callback) is false, throw a TypeError exception.
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }

    // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
    var thisArg = arguments[1];

    // 5. Let k be 0.
    var k = 0;

    // 6. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ! ToString(k).
      // b. Let kValue be ? Get(O, Pk).
      // c. Let testResult be ToBoolean(? Call(callback, T, « kValue, k, O »)).
      // d. If testResult is true, return kValue.
      var kValue = o[k];
      if (callback.call(thisArg, kValue, k, o)) {
        return kValue;
      }
      // e. Increase k by 1.
      k++;
    }

    // 7. Return undefined.
    return undefined;
  };
}

/**
 * Array.prototype.includes() polyfill
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!Array.prototype.includes) {
  Array.prototype.includes = function (search, start) {
    "use strict";
    if (search instanceof RegExp) {
      throw TypeError("first argument must not be a RegExp");
    }
    if (start === undefined) {
      start = 0;
    }
    return this.indexOf(search, start) !== -1;
  };
}

function generateUI(data, calendarObj) {
  generateEvents(data.events, calendarObj);
  generateCalendar(calendarObj.thisMonth, true);
  generateCalendar(calendarObj.nextMonth, false);
  appendEvents(data.calendarEvents);
  generateReleases(data.pubs);
  generateAnnouncements(data.anns);
  displayHappeningNow(data.events);
}

window.onload = function () {
  var calendarObj = generateCalendarObject();
  fetchData(calendarObj).then(function (res) {
    generateUI(res, calendarObj);
  });
};

function toggleSlides() {
  var slides = Array.from(document.querySelectorAll(".slide"));
  var activeSlide = slides.find(function (el) {
    if (Array.from(el.classList).includes("visible")) return el;
  });
  activeSlide.classList.toggle("visible");
  var index = slides.indexOf(activeSlide);
  return slides[index + 1 === slides.length ? 0 : index + 1].classList.toggle(
    "visible"
  );
}

window.setInterval(toggleSlides, 10000);

function fetchData(obj) {
  var ret = fetch("https://www.dvrpc.org/asp/homepage/default2.aspx")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      return data;
    })
    .then(function (data) {
      var timemin =
        obj.thisMonth[obj.thisMonth.length - 1].toLocaleDateString();
      var timemax = obj.nextMonth[0].toLocaleDateString();
      var appendEvents = fetch(
        `https://www.dvrpc.org/asp/homepage/getCalendarItems.aspx?timemin=${timemin}&timemax=${timemax}`
      )
        .then(function (res) {
          return res.json();
        })
        .then(function (events) {
          return Object.assign({}, data, { calendarEvents: events });
        });
      return appendEvents;
    })
    .then(function (data) {
      var annsArticles = fetch(
        "https://cms.dvrpc.org/jsonapi/node/article?filter[promote]=1&sort=-created&page[limit]=5"
      )
        .then(function (res) {
          return res.json();
        })
        .then(function (articles) {
          return Object.assign({}, data, { anns: [...articles.data] });
        });
      return annsArticles;
    })
    .then(function (data) {
      var annsAnnouncements = fetch(
        "https://cms.dvrpc.org/jsonapi/node/announcement?filter[promote]=1&sort=-created&page[limit]=5"
      )
        .then(function (res) {
          return res.json();
        })
        .then(function (anns) {
          return Object.assign({}, data, {
            anns: [...data.anns, ...anns.data],
          });
        });
      return annsAnnouncements;
    });
  return ret;
}

function generateAnnouncements(announcements) {
  var container = document.getElementById("anns-container");
  announcements = announcements.sort(function (a, b) {
    return new Date(b.attributes.created) - new Date(a.attributes.created);
  });
  for (var i = 0; i < announcements.length; i++) {
    var announcement = announcements[i];
    var { body, title } = announcement.attributes;
    var div = document.createElement("div");
    div.style.width = "80%";
    div.style.marginBottom = "3%";
    div.innerHTML +=
      '<div style="display: flex;"><span style="font-size:3.25em; font-weight: bold; margin: 0px;">' +
      title +
      "</span>";
    if (announcement.type === "node--announcement")
      div.innerHTML +=
        '<span style="font-weight:lighter;font-size:3em;color: rgb(209 213 219);">' +
        body.value +
        "</span></div>";
    container.appendChild(div);
  }
}

function generateRange(date) {
  var firstOfMonth = new Date(date);
  var lastOfMonth = new Date(firstOfMonth);
  var day = date.getDate();
  var currMonth = months[date.getMonth()];
  firstOfMonth.setDate(day - (day - 1));
  lastOfMonth.setDate(day + (currMonth.days - day));
  return { firstOfMonth: firstOfMonth, lastOfMonth: lastOfMonth };
}

function generateMonth(date) {
  var ret = [];
  var dateRange = generateRange(date);
  var startDate = dateRange.lastOfMonth;
  while (startDate >= dateRange.firstOfMonth) {
    if (startDate.getDay() > 0 && startDate.getDay() < 6) {
      ret.push(new Date(startDate));
    }
    var newDate = startDate.setDate(startDate.getDate() - 1);
    startDate = new Date(newDate);
  }
  return ret;
}

function generateCalendarObject() {
  var ret = { thisMonth: null, nextMonth: null };
  var thisMonth = new Date();
  var nextMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1);
  ret.thisMonth = generateMonth(thisMonth);
  ret.nextMonth = generateMonth(nextMonth);
  return ret;
}

function appendEvents(events) {
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var box = document.getElementById(event.StartDate);
    if (box) {
      box.style.backgroundColor = "#ccdde3";
      box.style.fontWeight = "bold";
      var info = document.createElement("div");
      info.style.height = "80%";
      info.style.width = "95%";
      info.style.display = "flex";
      info.style.justifyContent = "center";
      info.style.alignItems = "center";
      info.style.fontSize = "16px";
      info.style.fontWeight = "normal";
      info.textContent = event.Title;
      box.appendChild(info);
    }
  }
}

function generateCalendar(calendarArr, isThisMonth) {
  // dont append events and details until after the month actually starts
  var startAddDateIdx = calendarArr[calendarArr.length - 1].getDay();
  var container = isThisMonth
    ? document.getElementById("this-month-container")
    : document.getElementById("next-month-container");
  container.children[1].innerHTML = calendarArr[0].toLocaleString("en-us", {
    month: "long",
    year: "numeric",
  });

  // rows and cols of calendar
  for (var i = 1; i <= 5; i++) {
    var row = document.createElement("div");
    row.style.display = "flex";
    row.style.width = "80%";
    row.style.height = "14%";
    for (var j = i; j < i + 5; j++) {
      var box = document.createElement("div");
      box.style.backgroundColor = "#6698ac";
      box.style.height = "95%";
      box.style.width = "25%";
      box.style.margin = "0.75%";
      box.style.textAlign = "right";
      box.style.fontSize = "3em";
      if (
        calendarArr[calendarArr.length - 1] &&
        (i * j >= startAddDateIdx || i > 1)
      ) {
        box.id =
          calendarArr[calendarArr.length - 1].toLocaleDateString("fr-CA");
        box.innerHTML =
          '<span style="margin:5%;letter-spacing:0.05em;">' +
          calendarArr[calendarArr.length - 1].toLocaleString("en-us", {
            day: "2-digit",
          }) +
          "</span>";
        calendarArr.pop();
      } else {
        box.style.backgroundColor = "#01182b";
      }
      row.appendChild(box);
    }
    container.appendChild(row);
  }
}

var months = [
  {
    name: "January",
    short: "Jan",
    number: 1,
    days: 31,
  },
  {
    name: "February",
    short: "Feb",
    number: 2,
    days: 28,
  },
  {
    name: "March",
    short: "Mar",
    number: 3,
    days: 31,
  },
  {
    name: "April",
    short: "Apr",
    number: 4,
    days: 30,
  },
  {
    name: "May",
    short: "May",
    number: 5,
    days: 31,
  },
  {
    name: "June",
    short: "Jun",
    number: 6,
    days: 30,
  },
  {
    name: "July",
    short: "Jul",
    number: 7,
    days: 31,
  },
  {
    name: "August",
    short: "Aug",
    number: 8,
    days: 31,
  },
  {
    name: "September",
    short: "Sep",
    number: 9,
    days: 30,
  },
  {
    name: "October",
    short: "Oct",
    number: 10,
    days: 31,
  },
  {
    name: "November",
    short: "Nov",
    number: 11,
    days: 30,
  },
  {
    name: "December",
    short: "Dec",
    number: 12,
    days: 31,
  },
];

function generateEvents(events) {
  var container = document.getElementById("events-container");
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var eventDate = parseEventDate(events[0].StartDate);
  var eventsCopy = Array.from(events);
  // iterate through events and check if event has already happened
  while (today > eventDate) {
    if (eventsCopy.length === 6) break;
    eventsCopy.shift();
    eventDate = parseEventDate(events[0].StartDate);
  }
  // // only display the first 6 events
  if (eventsCopy.length > 6) {
    eventsCopy = eventsCopy.slice(
      0,
      eventsCopy.length - (eventsCopy.length - 6)
    );
  }

  for (var i = 0; i < eventsCopy.length; i++) {
    let event = eventsCopy[i];
    var date = new Date(event.StartDate);
    date.setDate(date.getDate() + 1);
    var div = document.createElement("div");
    var eventDate = document.createElement("div");
    eventDate.className = "event-date";
    var eventInfo = document.createElement("div");
    div.style.display = "flex";
    div.style.margin = "10px";
    div.style.backgroundColor = "#ccd1d5";
    div.style.height = "11%";
    div.style.width = "80%";
    div.style.alignItems = "center";
    eventDate.style.height = "70%";
    eventDate.style.minWidth = "17%";
    eventDate.style.marginLeft = "5%";
    eventDate.style.backgroundColor = "#005475";
    eventDate.style.color = "white";
    eventDate.style.textAlign = "center";
    eventDate.innerHTML +=
      '<div style="margin-top:7px;font-size:2.75em;display:flex;flex-direction:column;font-weight:bold;"><span style="color: #56b4d1; margin: 0px">' +
      date.toLocaleString("en-us", { month: "short" }).toUpperCase() +
      '</span> <span style="font-size:1.5em;font-weight:normal;">' +
      date.getDate() +
      "</span></div>";
    eventInfo.style.height = "100px";
    eventInfo.style.display = "flex";
    eventInfo.style.justifyContent = "center";
    eventInfo.style.flexDirection = "column";
    eventInfo.style.marginLeft = "5%";
    eventInfo.style.marginRight = "5%";
    eventInfo.style.fontSize = "1.75em";
    if (event.StartTime)
      eventInfo.innerHTML += "<span>" + parseTime(event.StartTime) + "</span>";
    eventInfo.innerHTML +=
      '<span style="font-weight: bold;">' + event.Title + "</span>";
    if (event.Location)
      eventInfo.innerHTML +=
        '<i style="font-weight: lighter">' + event.Location + "</i>";
    div.appendChild(eventDate);
    div.appendChild(eventInfo);
    container.appendChild(div);
  }
}

function parseTime(time) {
  var ret = "";
  var intTime = parseInt(time);
  if (intTime > 12) {
    ret += (intTime - 12).toString() + ":" + time.split(":")[1] + "pm";
  } else if (intTime === 0) {
    return "";
  } else {
    ret += time + "am";
  }
  return ret;
}

function parseEventDate(date) {
  var eventSplit = date.split("-");
  var eventDate = new Date(eventSplit[0], eventSplit[1] - 1, eventSplit[2]);
  return eventDate;
}

var slides = new Set([
  "Board and Executive Committee Meeting",
  "Climate Change Planning Forum Meeting",
  "Board and Executive Committee Meeting",
  "Climate Change Planning Forum Meeting",
  "Central Jersey Transportation Forum (CJTF) Meeting",
  "Delaware Valley Goods Movement Task Force Meeting",
  "Futures Group Meeting",
  "Healthy Communities Task Force Meeting",
  "Information Resources Exchnage Group (IREG) Meeting",
  "Public Participation Task Force Meeting",
  "Regional Aviation Committee (RAC) Meeting",
  "Regional Community & Economic Development Forum (RCEDF) Meeting",
  "Regional Safety Task Force Meeting",
  "Regional Technical Committee (RTC)",
  "Transportation Operations Task Force (TOTF) Meeting",
]);

function displayHappeningNow(events) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var happeningSlides = Array.from(
    document.querySelectorAll(".happening-container")
  );
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var eventDate = parseEventDate(event.StartDate);
    if (
      today.toUTCString() === eventDate.toUTCString() &&
      slides.has(event.Title.trim())
    ) {
      for (var j = 0; j < happeningSlides.length; j++) {
        if (happeningSlides[j].id === event.Title.trim().replace(/\s/g, "-")) {
          happeningSlides[j].classList.toggle("disabled");
          return;
        }
      }
    }
  }
  document
    .getElementById("default-happening-container")
    .classList.toggle("disabled");
}

function generateReleases(releases) {
  var container = document.getElementById("new-releases-container");
  for (var i = 0; i < releases.length; i++) {
    var release = releases[i];
    var div = document.createElement("div");
    var releaseImg = document.createElement("div");
    var releaseInfo = document.createElement("div");
    div.style.width = "75%";
    div.style.alignItems = "center";
    div.style.display = "flex";
    div.style.margin = "10px";
    div.style.marginLeft = "0px";
    div.style.backgroundColor = "#ccd1d5";
    div.style.padding = "25px";
    releaseImg.innerHTML +=
      '<img style="max-height:175px;"src=' +
      "https://www.dvrpc.org/asp/pubs/201px/" +
      release.PubId +
      ".png" +
      ">";
    releaseImg.style.minWidth = "25%";
    releaseImg.style.display = "flex";
    releaseImg.style.justifyContent = "center";
    releaseInfo.style.height = "150px";
    releaseInfo.style.display = "flex";
    releaseInfo.style.justifyContent = "center";
    releaseInfo.style.flexDirection = "column";
    releaseInfo.style.marginLeft = "20px";
    releaseInfo.innerHTML +=
      '<span style="font-weight: bold; font-size: 2.25em;">' +
      release.Title +
      "</span>";
    div.appendChild(releaseImg);
    div.appendChild(releaseInfo);
    container.appendChild(div);
  }
}
