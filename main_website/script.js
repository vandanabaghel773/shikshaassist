function init() {
    gsap.registerPlugin(ScrollTrigger);

    const locoScroll = new LocomotiveScroll({
        el: document.querySelector("#main"),
        smooth: true
    });

    locoScroll.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy("#main", {
        scrollTop(value) {
            return arguments.length 
                ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true }) 
                : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        },
        pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
    });

    ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
    ScrollTrigger.refresh();

    // **Stop scrolling when reaching footer**
    // const footer = document.querySelector(".footer");
    // locoScroll.on("scroll", (instance) => {
    //     const footerTop = footer.offsetTop;
    //     const scrollY = instance.scroll.y;
    //     const viewportHeight = window.innerHeight;

    //     if (scrollY + viewportHeight >= footerTop) {
    //         locoScroll.scrollTo(footerTop - viewportHeight, { duration: 0 });
    //     }
    // });

    // Allow scrolling back up
    window.addEventListener("wheel", (event) => {
        if (event.deltaY < 0) {
            locoScroll.start(); // Enable scrolling up
        }
    });
}

window.onload = () => {
    history.scrollRestoration = "manual"; // Prevents auto scroll restoration
    
};
init();


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

if (window.innerWidth <= 768) {  // Adjust for mobile
    tl.to(".page1 h1", { x: 0 }, "anim");
}




gsap.registerPlugin(ScrollTrigger);

// Background turns black when scrolling to About Us
gsap.to("#main", {
    backgroundColor: "",   // black color
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

