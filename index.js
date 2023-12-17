const puppeteer = require('puppeteer');
/**
 * Login, logout by google
 * Get data
 * Filter:Categories, Status, Datetime, Type, Saraly 
 * Search:
 * Push notifications
 * sub and unsub
 */

async function startBrowser() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    return { browser, page }
}

async function closeBrowser(browser) {
    return browser.close()
}

var account = {
    USERNAME: 'thong.nc@zinza.com.vn',
    PASSWORD: 'Zinza@2023'
}

const selector = {
    USERNAME_SELECTOR: '#username',
    PASSWORD_SELECTOR: '#password',
    CTA_SELECTOR: 'button[data-litms-control-urn="login-submit"]'
}

async function login(url) {
    const {
        browser,
        page
    } = await startBrowser()

    await page.goto(url)

    await page.setViewport({
        width: 1200,
        height: 800
    })

    await autoScroll(page)

    await page.screenshot({
        path: 'yoursite.png',
        fullPage: true
    })

    await Promise.all([
        page.$eval(selector.USERNAME_SELECTOR, element => element.value = 'thongnc06@gmail.com'),
        page.$eval(selector.PASSWORD_SELECTOR, element => element.value = 'Zinza@2023'),
        page.click(selector.CTA_SELECTOR),
        page.waitForNavigation()
    ])

    await page.goto('https://www.linkedin.com/in/lukasz-lazewski-40562718/')

    await page.waitForSelector('body')

    await page.screenshot({
        path: 'yoursite1.png',
        fullPage: true
    })

    const [
        fullName,
        intro,
        countries,
        contact,
    ] = await Promise.all([
        page.$eval('h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words', ele => ele.innerText),
        page.$eval('div.text-body-medium.break-words', ele => ele.innerText),
        page.$eval('span.text-body-small.inline.t-black--light.break-words', ele => ele.innerText),
        page.$eval('a#top-card-text-details-contact-info', ele => ele.href),
    ])

    const experience = await page.evaluate(() => {
        const containers = document.querySelectorAll('.artdeco-list__item ')
        const dataList = [];

        containers.forEach(item => {
            const role = item.querySelector('.t-bold > span')?.textContent.trim() || null
            const companyName = item.querySelector('.t-14.t-normal > span')?.textContent.trim() || null
            const duration = item.querySelector('.t-14.t-normal.t-black--light > span')?.textContent.trim() || null
            const location = item.querySelector('.t-14.t-normal.t-black--light:nth-child(4) > span')?.textContent.trim() || null

            dataList.push({ role, companyName, duration, location });
        });

        return dataList
    })

    const profile = {
        fullName,
        intro,
        countries,
        contact,
        experience
    }

    console.log(profile)

    await closeBrowser(browser)

    return { profile, browser }
}

async function loginLinkedin(page) {
    await page.goto(urlLogin)

    return await Promise.all([
        page.$eval(selector.USERNAME_SELECTOR, element => element.value = 'thongnc11@gmail.com'),
        page.$eval(selector.PASSWORD_SELECTOR, element => element.value = 'Zinza@2023'),
        page.click(selector.CTA_SELECTOR),
        page.waitForNavigation()
    ])
}

async function getJobDetails(page) {
    await page.waitForSelector('#job-details', {
        timeout: 300000,
    })

    const job = await page.evaluate(() => {
        const containers = document.querySelectorAll('.jobs-search__job-details--wrapper')

        let jobDetail = {}

        containers.forEach(container => {
            const position = container.querySelector('.job-details-jobs-unified-top-card__job-title-link')?.textContent.trim() || null
            const companyName = container.querySelector('.app-aware-link')?.textContent.trim() || null
            const companyLink = container.querySelector('.app-aware-link')?.href || null
            const type = container.querySelector('.job-details-jobs-unified-top-card__job-insight > span > span:nth-child(1)')?.textContent.trim() || null
            const time = container.querySelector('.job-details-jobs-unified-top-card__job-insight > span > span:nth-child(2)')?.textContent.trim() || null
            const level = container.querySelector('.job-details-jobs-unified-top-card__job-insight > span > span:nth-child(3)')?.textContent.trim() || null
            const skills = container.querySelector('.app-aware-link.job-details-how-you-match__skills-item-subtitle.t-14.overflow-hidden')?.textContent.trim() || null

            const jobDetails = container.querySelector('#job-details')
            const spanElement = jobDetails.querySelector('span')
            const pElements = spanElement ? Array.from(spanElement.querySelectorAll('p')) : []
            const ulElements = spanElement ? Array.from(spanElement.querySelectorAll('ul')) : []

            let aboutJob = ''

            pElements.forEach(ele => {
                aboutJob += ele?.textContent.trim() || ''
            })

            ulElements.forEach(ele => {
                aboutJob += ele?.textContent.trim() || ''
            })

            return jobDetail = {
                position,
                companyName,
                companyLink,
                type,
                time,
                level,
                aboutJob,
                skills
            }
        })

        return jobDetail
    })

    return job
}

async function startScraping(url) {
    const {
        browser,
        page
    } = await startBrowser();

    try {
        await getJobs(page, url);
    } finally {
        await closeBrowser(browser);
    }
}

async function getJobs(page, url) {
    await page.setViewport({
        width: 1200,
        height: 800
    })

    await autoScroll(page)

    await loginLinkedin(page)

    await page.goto(url)

    await page.waitForSelector('.scaffold-layout__list')

    const jobList = await page.evaluate(async () => {
        const container = document.querySelector('.scaffold-layout__list > div > ul')
        const jobItems = container ? Array.from(container.querySelectorAll('li.ember-view')) : []
        //return jobItems.map(ele => ele.getAttribute("data-occludable-job-id")).filter(Boolean)

        return jobItems.map(ele => ele.id)
    })

    await page.screenshot({
        path: `img.png`
    })

    const jobs = []

    for (const dataId of jobList) {
        console.log(getScrollBottom('jobs-search-results-list'))
        await page.waitForSelector(`li#${dataId}`, {
            timeout: 300000,
        });
        // await page.click(`li#${dataId}`)
        await Promise.all([
            // page.waitForNavigation({
            //     timeout: 300000,
            // }),
            page.click(`li#${dataId}`)
        ]);
        await page.screenshot({
            path: `img-${dataId}.png`
        })
        const job = await getJobDetails(page);
        const jobUrl = await page.url();
        jobs.push({ ...job, url: jobUrl });
    }
    console.log('jobs', jobs);
    return jobs
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

function getScrollBottom(className) {
    const ele = document.querySelector(`.${className}`);
    if (!ele) return -1
    return ele.addEventListener('scroll', function () {
        const distanceFromTop = ele.scrollTop;
        const totalHeight = ele.scrollHeight;
        const distanceFromBottom = totalHeight - (distanceFromTop + ele.clientHeight);
        return distanceFromBottom
    });
}

const urlLogin = 'https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin'
const urlJobs = 'https://www.linkedin.com/jobs/collections/'

// login(urlLogin)
startScraping(urlJobs)
