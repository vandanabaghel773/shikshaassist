
function init() {
    gsap.registerPlugin(ScrollTrigger);

    const locoScroll = new LocomotiveScroll({
        el: document.querySelector("#main"),
        smooth: true
    });

    locoScroll.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy("#main", {
        scrollTop(value) {
            return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
    });

    ScrollTrigger.addEventListener("refresh", () => {
        setTimeout(() => locoScroll.update(), 100);
    });

    ScrollTrigger.refresh();
}



window.onload = () => {
    history.scrollRestoration = "manual"; // Prevents browser from restoring the last scroll position
    setTimeout(() => {
        ScrollTrigger.refresh(); // Refresh GSAP triggers
    }, 100); // Delay to ensure proper initialization
};


init()

var crsr = document.querySelector(".cursor")
var main = document.querySelector("#main")
document.addEventListener("mousemove",function(dets){
    crsr.style.left = dets.x + 20+"px"
    crsr.style.top = dets.y + 20+"px"
})

gsap.from(".page1 h1,.page1 h2", {
    y: 10,
    rotate: 10,
    opacity: 0,
    delay: 0.3,
    duration: 0.7
})
var tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".page1 h1",
        scroller: "#main",
        // markers:true,
        start: "top 27%",
        end: "top 0",
        scrub: 3
    }
})
tl.to(".page1 h1", {
    x: -100,
}, "anim")
tl.to(".page1 h2", {
    x: 100
}, "anim")
tl.to(".page1 video", {
    width: "90%"
}, "anim")


var tlAbout = gsap.timeline({
    scrollTrigger: {
        trigger: ".about-us", // the section for your About Us page
        scroller: "#main",
        start: "top center",
        scrub: 3
    }
})

tlAbout.to("#main", {
    backgroundColor: "#black" // light background for About Us
})

gsap.registerPlugin(ScrollTrigger);

// Background turns black when scrolling to About Us
gsap.to("#main", {
    backgroundColor: "#0F0D0D",   // black color
    scrollTrigger: {
        trigger: ".about-us",      // your about us section
        scroller: "#main",         // using LocomotiveScroll's container
        start: "top center",       // when top of about-us hits center of viewport
        end: "bottom center",      // until bottom hits center
        scrub: true,               // smooth transition based on scroll
       
    }
});


function page4Animation() {
    var elemC = document.querySelector("#elem-container")
    var fixed = document.querySelector("#fixed-image")
    elemC.addEventListener("mouseenter", function () {
        fixed.style.display = "block"
    })
    elemC.addEventListener("mouseleave", function () {
        fixed.style.display = "none"
    })

    var elems = document.querySelectorAll(".elem")
    elems.forEach(function (e) {
        e.addEventListener("mouseenter", function () {
            var image = e.getAttribute("data-image")
            fixed.style.backgroundImage = `url(${image})`
        })
    })
}
page4Animation();
function swiperAnimation() {
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: "auto",
        centeredSlides: true,
        spaceBetween: 100,
    });
}



function menuAnimation() {

    var menu = document.querySelector("nav h3")
    var full = document.querySelector("#full-scr")
    var navimg = document.querySelector("nav img")
    var flag = 0
    menu.addEventListener("click", function () {
        if (flag == 0) {
            full.style.top = 0
            navimg.style.opacity = 0
            flag = 1
        } else {
            full.style.top = "-100%"
            navimg.style.opacity = 1
            flag = 0
        }
    })
}

function loaderAnimation() {
    var loader = document.querySelector("#loader")
    setTimeout(function () {
        loader.style.top = "-100%"
    }, 4200)
}


loaderAnimation()



const circle = document.getElementById('circle');
const navPart2 = document.getElementById('nav-part2');

circle.addEventListener('click', () => {
  navPart2.classList.toggle('show');
});

  function scrollToSection() {
    const section = document.querySelector('#page2'); // Change this to your target section
    section.scrollIntoView({ behavior: 'smooth' });
  }

