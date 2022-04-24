/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { defineComponent, h, onMounted, reactive, ref, Ref, UnwrapRef } from "vue"
import { ElIcon, ElMenu, ElMenuItem, ElMenuItemGroup, MenuItemRegistered } from "element-plus"
import { RouteLocationNormalizedLoaded, Router, useRoute, useRouter } from "vue-router"
import { I18nKey, t } from "@app/locale"
import { MenuMessage } from "@app/locale/components/menu"
import { GITHUB_ISSUE_ADD, HOME_PAGE, MEAT_URL, TU_CAO_PAGE, ZH_FEEDBACK_PAGE } from "@util/constant/url"
import { Aim, Calendar, ChatSquare, Folder, Food, HotWater, Rank, SetUp, Stopwatch, Sugar, Tickets, Timer } from "@element-plus/icons-vue"
import ElementIcon from "../element-ui/icon"
import { locale } from "@util/i18n"
import { IS_EDGE } from "@util/constant/environment"

type _MenuItem = {
    title: keyof MenuMessage
    icon: ElementIcon
    route?: string
    href?: string
    index?: string
}

type _MenuGroup = {
    title: keyof MenuMessage
    children: _MenuItem[]
}

type _RouteProps = {
    router: Router
    current: RouteLocationNormalizedLoaded
}

/**
 * Use ZH_FEEDBACK_PAGE, if the locale is Chinese
 * 
 * @since 0.3.2
 */
let realFeedbackLink: string = GITHUB_ISSUE_ADD
if (locale === 'zh_CN') {
    // Gray for new feedback page
    // todo
    realFeedbackLink = IS_EDGE ? TU_CAO_PAGE : ZH_FEEDBACK_PAGE
}

const OTHER_MENU_ITEMS: _MenuItem[] = [{
    title: 'feedback',
    href: realFeedbackLink,
    icon: ChatSquare,
    index: '_feedback'
}]
HOME_PAGE && OTHER_MENU_ITEMS.push({
    title: 'rate',
    href: HOME_PAGE,
    icon: Sugar,
    index: '_rate'
})
OTHER_MENU_ITEMS.push({
    title: 'meat',
    href: MEAT_URL,
    icon: Food,
    index: '_meat'
})

// All menu items
const ALL_MENU: _MenuGroup[] = [
    {
        title: 'data',
        children: [{
            title: 'dataReport',
            route: '/data/report',
            icon: Calendar
        }, {
            title: 'dataHistory',
            route: '/data/history',
            icon: Stopwatch
        }, {
            title: 'dataClear',
            route: '/data/manage',
            icon: Folder
        }]
    }, {
        title: 'behavior',
        children: [{
            title: 'habit',
            route: '/behavior/habit',
            icon: Aim
        }, {
            title: 'limit',
            route: '/behavior/limit',
            icon: Timer
        }]
    }, {
        title: 'additional',
        children: [{
            title: 'siteManage',
            route: '/additional/site-manage',
            icon: HotWater
        }, {
            title: 'whitelist',
            route: '/additional/whitelist',
            icon: Tickets
        }, {
            title: 'mergeRule',
            route: '/additional/rule-merge',
            icon: Rank
        }, {
            title: 'option',
            route: '/additional/option',
            icon: SetUp
        }]
    }, {
        title: 'other',
        children: OTHER_MENU_ITEMS
    }
]

function openMenu(route: string, title: I18nKey, routeProps: UnwrapRef<_RouteProps>) {
    const routerVal = routeProps.router
    const currentRouteVal = routeProps.current
    if (currentRouteVal && currentRouteVal.path !== route) {
        routerVal && routerVal.push(route)
        document.title = t(title)
    }
}

const openHref = (href: string) => {
    chrome.tabs.create({ url: href })
}

function handleClick(_MenuItem: _MenuItem, routeProps: UnwrapRef<_RouteProps>) {
    const { route, title, href } = _MenuItem
    if (route) {
        openMenu(route, msg => msg.menu[title], routeProps)
    } else {
        openHref(href)
    }
}

const iconStyle: Partial<CSSStyleDeclaration> = {
    paddingRight: '4px',
    paddingLeft: '4px',
    height: '1em',
    lineHeight: '0.83em'
}

function renderMenuLeaf(menu: _MenuItem, routeProps: UnwrapRef<_RouteProps>) {
    const { route, title, icon, index } = menu
    const props: { onClick: (item: MenuItemRegistered) => void; index?: string } = {
        onClick: (_item) => handleClick(menu, routeProps)
    }
    const realIndex = index || route
    realIndex && (props.index = realIndex)
    return h(ElMenuItem, props,
        {
            default: () => h(ElIcon, { size: 15, style: iconStyle }, () => h(icon)),
            title: () => h('span', t(msg => msg.menu[title]))
        }
    )
}

function renderMenu(menu: _MenuGroup, props: UnwrapRef<_RouteProps>) {
    const title = t(msg => msg.menu[menu.title])
    return h(ElMenuItemGroup, { title }, () => menu.children.map(item => renderMenuLeaf(item, props)))
}

const _default = defineComponent({
    name: "LayoutMenu",
    setup() {
        const routeProps: UnwrapRef<_RouteProps> = reactive({
            router: useRouter(),
            current: useRoute()
        })

        onMounted(() => document.title = t(msg => msg.menu.data))

        return () => h(ElMenu,
            { defaultActive: routeProps.current.path },
            () => ALL_MENU.map(menu => renderMenu(menu, routeProps))
        )
    }
})

export default _default