document.addEventListener("DOMContentLoaded", () => {
  const womenRow = document.querySelector(".women-row");
  const menRow = document.querySelector(".men-row");
  const homeProductRow = document.querySelector(".home-product-row");
  const productDetailBox = document.querySelector(".pd-product-box");
  const checkoutSummary = document.querySelector(".check-order-summary");
  const loader = document.getElementById("loader");
  const errorBox = document.getElementById("error-message");

  function showLoader() {
    if (loader) loader.classList.remove("hidden");
  }
  function hideLoader() {
    if (loader) loader.classList.add("hidden");
  }
  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }
  }

  async function fetchData() {
    showLoader();
    try {
      const response = await fetch("https://v2.api.noroff.dev/rainy-days");
      if (!response.ok) {
        throw new Error("API fetch failed");
      }
      const data = await response.json();
      const jackets = data.data;

      if (productDetailBox) {
        const params = new URLSearchParams(window.location.search);
        const jacketId = params.get("id");
        const jacket = jackets.find((j) => j.id === jacketId);

        if (jacket) {
          displayJacketDetail(jacket);
        } else {
          productDetailBox.innerHTML = "<p>Product not found.</p>";
        }
      }

      if (womenRow && menRow) {
        womenRow.innerHTML = "";
        menRow.innerHTML = "";
        jackets.forEach((jacket) => {
          const product = document.createElement("div");
          product.classList.add("products-product-item");
          product.innerHTML = `
            <a href="productdetail.html?id=${jacket.id}">
              <img src="${jacket.image.url}" alt="${jacket.image.alt}" />
            </a>
            <div class="products-product-info">
              <p>${jacket.title}</p>
              <p>${jacket.price} NOK</p>
            </div>
          `;
          if (jacket.gender === "Female") {
            womenRow.appendChild(product);
          } else if (jacket.gender === "Male") {
            menRow.appendChild(product);
          }
        });
      }

      // Home pag //
      if (homeProductRow) {
        homeProductRow.innerHTML = "";
        jackets.forEach((jacket) => {
          const product = document.createElement("div");
          product.classList.add("home-product-item");
          product.innerHTML = `
            <a href="productdetail.html?id=${jacket.id}">
              <img src="${jacket.image.url}" alt="${jacket.image.alt}" />
            </a>
            <div class="home-product-info">
              <p>${jacket.title}</p>
              <p>${jacket.price} NOK</p>
            </div>
            <button class="add-to-cart-btn">Add to cart</button>
          `;
          const button = product.querySelector(".add-to-cart-btn");
          button.addEventListener("click", () => addToCart(jacket));
          homeProductRow.appendChild(product);
        });
      }
    } catch (error) {
      showError("Something went wrong, please try again later.");
      if (womenRow)
        womenRow.innerHTML =
          "<p>Failed to load products. Please try again later.</p>";
      if (menRow)
        menRow.innerHTML =
          "<p>Failed to load products. Please try again later.</p>";
      if (homeProductRow)
        homeProductRow.innerHTML =
          "<p>Failed to load products. Please try again later.</p>";
    } finally {
      hideLoader();
    }
  }

  if (productDetailBox || (womenRow && menRow) || homeProductRow) {
    fetchData();
  }

  // Detail page //
  function displayJacketDetail(jacket) {
    productDetailBox.innerHTML = `
      <div class="pd-product-image">
        <img src="${jacket.image.url}" alt="${jacket.image.alt}" />
      </div>
      
      <div class="pd-product-info">
        <h1>${jacket.title}</h1>
        <p class="pd-price">${jacket.price} NOK</p>
        <p class="pd-description">${jacket.description}</p>

        <div class="pd-sizes"></div>
        <button class="pd-add-to-bag">Add to bag</button>
      </div>
    `;
    const sizesContainer = document.querySelector(".pd-sizes");
    const addToBagBtn = document.querySelector(".pd-add-to-bag");
    let selectedSize = null;

    if (jacket.sizes && jacket.sizes.length > 0) {
      sizesContainer.innerHTML = "<p><strong>Sizes:</strong></p>";

      jacket.sizes.forEach((size) => {
        const btn = document.createElement("button");
        btn.classList.add("size-btn");
        btn.textContent = size;
        btn.addEventListener("click", () => {
          selectedSize = size;
          document
            .querySelectorAll(".size-btn")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
        sizesContainer.appendChild(btn);
      });
    }

    addToBagBtn.addEventListener("click", () => {
      if (!selectedSize) {
        alert("Please select a size.");
        return;
      }
      addToCart({ ...jacket, size: selectedSize });
    });
  }

  // item to cart //
  function addToCart(jacket) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProduct = cart.find(
      (item) => item.id === jacket.id && item.size === jacket.size,
    );
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({
        id: jacket.id,
        title: jacket.title,
        price: jacket.price,
        image: jacket.image,
        color: jacket.baseColor,
        size: jacket.size,
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Product added to cart!");
  }

  // Cart page //
  const cartContainer = document.querySelector(".cart-items");
  if (cartContainer) {
    displayCart();
    updateOrderSummary();
  }

  function displayCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartContainer.innerHTML = "";
    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }
    cart.forEach((item, index) => {
      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");
      cartItem.innerHTML = `
        <img src="${item.image.url}" alt="${item.image.alt}" />
        <div class="cart-item-info">
          <h2>${item.title}</h2>
          <label>Quantity:</label>
          <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input">
          <p>Color: ${item.color}</p>
          <p>Size: ${item.size}</p>
          <p class="cart-price">${item.price} NOK</p>
          <button data-index="${index}" class="remove-btn">Remove</button>
        </div>
      `;
      cartContainer.appendChild(cartItem);
    });
    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const idx = e.target.dataset.index;
        const newQty = parseInt(e.target.value);
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart[idx].quantity = newQty;
        localStorage.setItem("cart", JSON.stringify(cart));
        displayCart();
        updateOrderSummary();
      });
    });
    document.querySelectorAll(".remove-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        displayCart();
        updateOrderSummary();
      });
    });
  }

  function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += Number(item.price) * Number(item.quantity);
    });
    const formattedTotal = subtotal.toLocaleString("no-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const subtotalEl = document.querySelector(".cart-subtotal");
    const totalEl = document.querySelector(".cart-total");
    if (subtotalEl) subtotalEl.textContent = formattedTotal + " NOK";
    if (totalEl) totalEl.textContent = formattedTotal + " NOK";
  }

  // Checkout page //
  if (checkoutSummary) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let subtotal = 0;
    checkoutSummary.innerHTML = "";
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      checkoutSummary.innerHTML += `
        <div class="checkout-item">
          <img src="${item.image.url}" alt="${item.title}" width="80" />
          <div class="checkout-item-info">
            <h3>${item.title}</h3>
            <p>Size: ${item.size}</p>
            <p>Color: ${item.color}</p>
            <p>Quantity: ${item.quantity}</p>
            <p>Price: ${item.price} NOK</p>
            <p><strong>Total: ${itemTotal} NOK</strong></p>
          </div>
        </div>
        <hr />
      `;
    });
    const formattedSubtotal = subtotal.toLocaleString("no-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    checkoutSummary.innerHTML += `
      <div class="checkout-total">
        <h3>Subtotal: ${formattedSubtotal} NOK</h3>
        <h2>Total: ${formattedSubtotal} NOK</h2>
      </div>
    `;
  }

  const form = document.getElementById("payment-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const cardNumber = document.getElementById("cardNumber").value.trim();
      const expiration = document.getElementById("expiration").value.trim();
      const security = document.getElementById("security").value.trim();
      if (!cardNumber || !expiration || !security) {
        alert("Please fill in all payment details before paying.");
        return;
      }
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      let total = 0;
      cart.forEach((item) => {
        total += Number(item.price) * Number(item.quantity);
      });
      localStorage.setItem("lastOrderTotal", total);
      localStorage.removeItem("cart");
      window.location.href = "payment.html";
    });
  }

  // confirmation page//
  const confirmedAmount = document.getElementById("confirmed-amount");
  if (confirmedAmount) {
    const total = localStorage.getItem("lastOrderTotal");
    if (total) {
      const formattedTotal = Number(total).toLocaleString("no-NO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      confirmedAmount.textContent = formattedTotal + " NOK";
      localStorage.removeItem("lastOrderTotal");
    } else {
      confirmedAmount.textContent = "0.00 NOK";
    }
  }
});
