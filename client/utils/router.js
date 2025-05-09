``;
("use strict");

//#region IMPORTS

// import { Base } from "./base.js";

//#endregion IMPORTS

//#region CLASS

window.customElements.define(
  "router-χ",
  class extends HTMLElement {
    // constructor() {

    //     super();

    //     this._shadowRoot = this.attachShadow({ 'mode': 'open' });

    //     this._shadowRoot.appendChild(template.content.cloneNode(true));

    //     this.$example = this._shadowRoot.querySelector(".example");

    // }

    // component attributes

    static get observedAttributes() {
      return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {}

    /**

     * Router looks for a wc-outlet tag for updating the views on history updates.

     * Example:

    *

    * <router>

    *  <outlet>

    *    <!-- All DOM update will be happening here on route change -->

    *  </outlet>

    * </router>

    */

    get outlet() {
      return this.querySelector("outlet-χ");
    }

    get root() {
      return window.location.pathname;
    }

    /**

     * Get all routes from the direct wc-route child element.

     * The document title can be updated by providing an

     * title attribute to the wc-route tag

    */

    get routes() {
      return Array.from(this.querySelectorAll("route-χ"))

        .filter((node) => node.parentNode === this)

        .map((r) => ({
          path: r.getAttribute("path"),

          // Optional: document title

          title: r.getAttribute("title"),

          // name of the web component the should be displayed

          component: r.getAttribute("component"),

          // Bundle path if lazy loading the component

          resourceUrl: r.getAttribute("resourceUrl"),
        }));
    }

    // Debug method to check routes

    logRoutes() {
      console.log("Available routes:", this.routes);
    }

    connectedCallback() {
      this.bindRoutes(this);

      this.navigate(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      );

      window.addEventListener("popstate", this._handlePopstate);
    }

    disconnectedCallback() {
      window.removeEventListener("popstate", this._handlePopstate);
    }

    loaded() {
      return true;
    }

    _handlePopstate = () => {
      this.navigate(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      );
    };

    bindRoutes(elem) {
      /**

         * Find all child link elements with route attribute to update the

         * href with route attribute value.

        *

        * Add custom click event handler to prevent the default

        * behaviour and navigate to the registered route onclick.

        */

      elem.querySelectorAll("a[route]").forEach((link) => {
        const target = link.getAttribute("route");

        if (target === "undefined") return;

        link.setAttribute("href", target);

        link.onclick = (e) => {
          e.preventDefault();

          this.navigate(target);
        };
      });

      elem.shadowRoot?.querySelectorAll("a[route]").forEach((link) => {
        const target = link.getAttribute("route");

        if (target === "undefined") return;

        link.setAttribute("href", target);

        link.onclick = (e) => {
          e.preventDefault();

          this.navigate(target);
        };
      });
    }

    navigate(url) {
      console.log("Navigating to:", url);

      console.log("Available routes:", this.routes);

      const matchedRoute = match(this.routes, url);

      console.log("Matched route:", matchedRoute);

      if (matchedRoute !== null) {
        this.activeRoute = matchedRoute;

        window.history.pushState(null, null, url);

        this.update();
      } else {
        console.warn("No matching route found for:", url);
      }
    }

    /**

     * Update the DOM under outlet based on the active

     * selected route.

    */

    update() {
      const {
        component,

        title,

        params = {},

        resourceUrl,
      } = this.activeRoute;

      console.log("Active Route:", this.activeRoute);

      console.log("ResourceUrl:", resourceUrl);

      if (component) {
        // Remove all child nodes under outlet element

        while (this.outlet.firstChild) {
          const child = this.outlet.firstChild;

          console.log(child);

          // if (child instanceof Base) {

          //     child.beforeDisconnectedCallback().then()

          // }

          this.outlet.removeChild(child);
        }

        const updateView = () => {
          const view = document.createElement(component);

          document.title = title || document.title;

          for (let key in params) {
            /**

                     * all dynamic param value will be passed

                     * as the attribute to the newly created element

                     * except * value.

                    */

            if (key !== "*") view.setAttribute(key, params[key]);
          }

          this.outlet.appendChild(view);

          // Update the route links once the DOM is updated

          this.bindRoutes(this);

          const ev = new CustomEvent("observer-notify", {
            detail: { key: "route-changed", value: this.activeRoute },

            bubbles: true,

            composed: true,
          });

          this.dispatchEvent(ev);
        };

        // Fix: Use resourceUrl correctly by checking if it exists as a string

        if (resourceUrl) {
          console.log("Loading from provided resourceUrl:", resourceUrl);

          import(resourceUrl).then(updateView).catch((error) => {
            console.error("Failed to load component from resourceUrl:", error);
          });
        } else {
          let defaultResourceUrl = "/pages/" + component + ".js";

          console.log("Loading from default resourceUrl:", defaultResourceUrl);

          import(defaultResourceUrl).then(updateView).catch((error) => {
            console.error("Failed to load component from default path:", error);
          });
        }
      }
    }

    go(url) {
      this.navigate(url);
    }

    back() {
      window.history.go(-1);
    }
  },
);

let paramRe = /^:(.+)/;

function segmentize(uri) {
  return uri.replace(/(^\/+|\/+$)/g, "").split("/");
}

/**

* The url matching function. Pass the route definitions and url to the match

* and the method will return the matched definition or null if there is no

* fallback scenario found is the definitions.

*

* Code is extracted from Reach router path match implementation

* https://github.com/reach/router/blob/master/src/lib/utils.js

*

* @param {Array} routes - Route defenitions

* @param {string} uri - Url to match

*/

export function match(routes, fullUri) {
  let match;

  const [uri] = fullUri.split("#");

  const [uriPathname] = uri.split("?");

  const uriSegments = segmentize(uriPathname);

  console.log("Matching segments:", uriSegments);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];

    const routeSegments = segmentize(route.path);

    console.log(`Checking route ${route.path} with segments:`, routeSegments);

    // Skip if segments length doesn't match and there's no wildcard

    if (
      uriSegments.length !== routeSegments.length &&
      !routeSegments.includes("*") &&
      !routeSegments.some((segment) => segment.startsWith(":"))
    ) {
      console.log(`Skipping route ${route.path} - segment length mismatch`);

      continue;
    }

    const max = Math.max(uriSegments.length, routeSegments.length);

    let index = 0;

    let missed = false;

    let params = {};

    for (; index < max; index++) {
      const uriSegment = uriSegments[index];

      const routeSegment = routeSegments[index];

      // Handle end of segments

      if (routeSegment === undefined) {
        missed = true;

        break;
      }

      if (uriSegment === undefined) {
        missed = true;

        break;
      }

      // Handle wildcard

      const fallback = routeSegment === "*";

      if (fallback) {
        params["*"] = uriSegments

          .slice(index)

          .map(decodeURIComponent)

          .join("/");

        break;
      }

      // Handle dynamic parameter

      let dynamicMatch = paramRe.exec(routeSegment);

      if (dynamicMatch) {
        console.log(
          `Found dynamic segment: ${routeSegment} matches ${uriSegment}`,
        );

        let value = decodeURIComponent(uriSegment);

        params[dynamicMatch[1]] = value;
      }

      // Handle static segment
      else if (routeSegment !== uriSegment) {
        console.log(`Mismatch: ${routeSegment} ≠ ${uriSegment}`);

        missed = true;

        break;
      }
    }

    if (!missed) {
      console.log(`Found match: ${route.path} with params:`, params);

      match = {
        params,

        ...route,
      };

      break;
    }
  }

  return match || null;
}
