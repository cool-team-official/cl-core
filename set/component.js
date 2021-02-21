import Vue from "vue";
import cool from "cool";
import { deepMerge, isObject } from "../utils";

export default function (options = {}) {
	if (!options.events) {
		options.events = {};
	}

	// 组件注册的视图
	let componentView = [];

	// 组件列表
	let components = [];

	// 安装组件
	function install(comp) {
		let { store, components, service, directives, filters, pages, views, name } = comp;
		let { onInstall, onSuccess, onFail } = options.events[name] || {};

		try {
			const next = () => {
				// 注册vuex模块
				if (store) {
					for (let i in store) {
						options.store.registerModule(`${name}-${i}`, store[i]);
					}
				}

				// 注册组件
				if (components) {
					for (let i in components) {
						Vue.component(components[i].name, components[i]);
					}
				}

				// 注册请求服务
				if (service) {
					deepMerge(options.store.$service, service);
				}

				// 注册指令
				if (directives) {
					for (let i in directives) {
						Vue.directive(i, directives[i]);
					}
				}

				// 注册过滤器
				if (filters) {
					for (let i in filters) {
						Vue.filter(i, filters[i]);
					}
				}

				// 注册页面
				if (pages) {
					for (let i in pages) {
						options.router.addRoutes([
							{
								path: i,
								component: pages[i]
							}
						]);
					}
				}

				// 注册视图
				if (views) {
					for (let i in views) {
						componentView.push({
							path: i,
							component: views[i]
						});
					}
				}

				// 包安装成功
				if (onSuccess) onSuccess(comp);
			};

			// 安装前
			if (onInstall) {
				onInstall(comp, { next });
			} else {
				next();
			}
		} catch (e) {
			console.error(e);

			// 安装失败
			if (onFail) onFail(comp, e);
		}
	}

	// 解析组件
	cool.components.map((e) => {
		if (!e) {
			return null;
		}

		let comp = null;

		if (isObject(e)) {
			comp = e;
		} else {
			comp = {
				name: e[0],
				value: e[1],
				options: e[2]
			};
		}

		// 是否开启
		if (comp.options && comp.options.enable === false) {
			return null;
		}

		if (comp) {
			comp = {
				name: comp.name,
				options: comp.options,
				...comp.value
			};

			components.push(comp);
			install(comp);
		}
	});

	// 设置缓存
	options.store.commit("SET_COMPONENT_VIEWS", componentView);
	options.store.commit("SET_COMPONENT", components);
}