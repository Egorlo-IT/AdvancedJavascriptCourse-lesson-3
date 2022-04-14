/*
1. Переделайте getRequest() так, чтобы она использовала промисы.
2. Добавьте в соответствующие классы методы добавления товара в корзину, 
удаления товара из корзины и получения списка товаров корзины.
*/

"use strict";

const elShoppingCart = document.querySelector(".cart");
const elCartTotal = document.querySelector(".cart-total");
document.querySelector(".btn-cart").addEventListener("click", () => {
  elShoppingCart.hidden = !elShoppingCart.hidden;
});

const API =
  "https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses";

let getRequest = (url) => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
          reject(`Error ${xhr.responseText}`);
        } else {
          resolve(xhr.responseText);
        }
      }
    };
    xhr.send();
  });
};

class ProductList {
  constructor(cart, container = ".products") {
    this.cart = cart;
    this.container = document.querySelector(container);
    this._goods = [];
    this._productsObjects = [];
    this._fetchGoods();
    this.cart._getCart();
  }

  _fetchGoods() {
    getRequest(`${API}/catalogData.json`)
      .then((data) => {
        this._goods = JSON.parse(data);
        this._render(this._goods);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getTotalPrice() {
    return this._productsObjects.reduce(
      (accumulator, good) => accumulator + good.price,
      0
    );
  }

  _render() {
    for (const product of this._goods) {
      const productObject = new ProductItem(product);
      this._productsObjects.push(productObject);
      this.container.insertAdjacentHTML(
        "beforeend",
        productObject.getHTMLString()
      );
    }

    document.querySelectorAll(".product-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (
          event.target.classList.contains("buy-btn") &&
          event.target.parentNode.parentNode.attributes["data-id"].value
        ) {
          this.cart._addToCart(
            event.target.parentNode.parentNode.attributes["data-id"].value,
            this._goods
          );
        }
      });
    });
  }
}

class ProductItem {
  constructor(product, img = "https://via.placeholder.com/200x150") {
    this.id = product.id_product;
    this.title = product.product_name;
    this.price = product.price;
    this.img = img;
  }

  getHTMLString() {
    return `
      <div class="product-item" data-id="${this.id}">
        <img src="${this.img}" alt="Some img">
        <div class="desc">
          <h3>${this.title}</h3>
          <p>${this.price} \u20bd</p>
          <button class="buy-btn">Купить</button>
        </div>
      </div>
    `;
  }
}

class Cart {
  constructor(container = ".cart-table") {
    this.container = document.querySelector(container);
    this._goods = [];
    this._productsObjects = [];
  }

  async _addToCart(id, products) {
    try {
      const response = await fetch(`${API}/addToBasket.json`);
      const data = await response.json();
      if (data.result === 1) {
        if (!!this._goods.find((el) => el.id_product === +id)) {
          this._goods.forEach((item) => {
            if (item.id_product === +id) {
              item.quantity++;
            }
          });
          this._render();
        } else {
          products.forEach((item) => {
            if (item.id_product === +id) {
              this._goods.push({
                id_product: item.id_product,
                product_name: item.product_name,
                price: item.price,
                quantity: 1,
              });
            }
          });

          this._render();
        }

        return data;
      } else {
        throw new Error(
          "An error occurred while adding an good to the basket."
        );
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async _deleteFromCart(id) {
    try {
      const response = await fetch(`${API}/deleteFromBasket.json`);
      const data = await response.json();
      if (data.result === 1) {
        this._goods = this._goods.filter((el) => el.id_product !== +id);
        this._render();
      } else {
        throw new Error(
          "An error occurred while deleting an good from the basket."
        );
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async _getCart() {
    try {
      const response = await fetch(`${API}/getBasket.json`);
      const data = await response.json();
      if (data.countGoods && data.countGoods !== 0) {
        this._goods = data.contents;
        this._render();
      } else {
        throw new Error(
          "An error occurred while received an goods from the basket, the basket may be empty"
        );
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  _getTotalPrice() {
    return this._productsObjects.reduce(
      (accumulator, good) => accumulator + good.total,
      0
    );
  }

  _render() {
    elShoppingCart.querySelectorAll(".lineItem").forEach((el) => {
      el.parentNode.parentNode.remove();
    });

    this._productsObjects = [];

    for (const product of this._goods) {
      const productObject = new CartItem(product);
      this._productsObjects.push(productObject);
      this.container.insertAdjacentHTML(
        "beforeend",
        productObject.getHTMLString()
      );
    }

    document.querySelectorAll(".btnRemove").forEach((el) => {
      el.addEventListener("click", (event) => {
        this._deleteFromCart(event.target.attributes["data-id"].value);
      });
    });

    elCartTotal.textContent = `${this._getTotalPrice()} \u20bd`;
  }
}

class CartItem {
  constructor(product) {
    this.id = product.id_product;
    this.title = product.product_name;
    this.quantity = product.quantity;
    this.price = product.price;
    this.total = product.quantity * product.price;
  }

  getHTMLString() {
    return `
      <tr>
        <td class="lineItem">${this.title}</td>
        <td class="lineItem">${this.quantity}</td>
        <td class="lineItem">${this.price} \u20bd</td>
        <td class="lineItem">${this.quantity * this.price} \u20bd</td>
        <td class="lineItem">
          <button class="btnRemove" data-id=${this.id}> - </button>
        </td>
      </tr>
    `;
  }
}

const cart = new Cart();
const list = new ProductList(cart);
