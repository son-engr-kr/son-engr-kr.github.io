function loadContent(originURL, tabName) {
    


    // fetch(`tabs/${tabName}.html`)
    fetch(`${originURL}${tabName}.html`)
        .then(response => response.text())
        .then(html => {
            console.log('Content loaded:', this);
            document.getElementById('main').innerHTML = html;

        })
        .catch(error => {
            console.error('Error loading the content:', error);
            document.getElementById('content').innerHTML = '<p>Error loading content.</p>';
        });
    
}
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.nav-tab');
    const homeNav = document.querySelector('#home-nav');
    const navTabHome = document.querySelector('#nav-tab-home');
    console.log(`window.location.hostname: ${window.location.hostname}`)
    console.log(`tabs: ${tabs}`)
    let baseURL = window.location.pathname;
    if(baseURL === "/"){
        // baseURL = "";
    }
    baseURL = baseURL.replace("index.html", "");
    console.log(`baseURL: ${baseURL}`)
    let homeAnchor = homeNav.querySelector('a');
    homeAnchor.addEventListener('click', function(event) {
        event.preventDefault();

        const anchor = navTabHome.querySelector('a');
        anchor.click();
    });
    tabs.forEach(tab => {
        const anchor = tab.querySelector('a');
        anchor.addEventListener('click', function(event) {
            // Prevent the default action (i.e., following the link)
            console.log(`baseURL1: ${baseURL}`)

            event.preventDefault();

            // 현재 active 클래스를 가진 모든 요소에서 active 클래스를 제거합니다.
            tabs.forEach(t => t.classList.remove('current'));
            
            // 클릭된 탭에 active 클래스를 추가합니다.
            tab.classList.add('current');
            
            const tabName = this.getAttribute('href').split('=')[1];
            if (!tabName) {
                tabName = "home"
            }
            let tab_url = `tab_${tabName}`
            loadContent(baseURL, tab_url);
            history.pushState(null, '', `${baseURL}?tab=${tabName}`);
            console.log(`/?tab=${tabName}`);

        });
    });

    console.log("hello 1");
    const urlParams = new URLSearchParams(window.location.search);
    let tabName = urlParams.get('tab');
    if (!tabName) {
        tabName = "home"
    }
    let tab_url = `tab_${tabName}`
    loadContent(baseURL, tab_url);

    // Activate the corresponding tab
    const tabToActivate = document.querySelector(`#nav-tab-${tabName}`);
    if (tabToActivate) {
        tabToActivate.classList.add('current');
    }
});
