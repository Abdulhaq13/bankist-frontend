"use strict";

// ═══════════════════════════════════════════════
// SCREEN ELEMENTS
// ═══════════════════════════════════════════════

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ═══════════════════════════════════════════════
// DASHBOARD ELEMENTS
// ═══════════════════════════════════════════════

const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerMovements = document.querySelector(".movements");

const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

// ═══════════════════════════════════════════════
// SCREEN SWITCHER
// ═══════════════════════════════════════════════

const showLogin = () => {
  loginScreen.classList.remove("hidden");
  dashboardScreen.classList.add("hidden");
};

const showDashboard = () => {
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
};

// ═══════════════════════════════════════════════
// localStorage HELPERS
// ═══════════════════════════════════════════════

const saveSession = (acc) =>
  localStorage.setItem("bankist_account", JSON.stringify(acc));
const clearSession = () => localStorage.removeItem("bankist_account");
const loadSession = () => {
  try {
    const d = localStorage.getItem("bankist_account");
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════
// FORMATTING HELPERS (unchanged from original)
// ═══════════════════════════════════════════════

const formatMovementDate = (date, locale) => {
  const daysPassed = Math.round(
    Math.abs(new Date() - date) / (1000 * 60 * 60 * 24),
  );
  if (daysPassed === 0) return "Today";
  if (daysPassed === 1) return "Yesterday";
  if (daysPassed <= 7) return `${daysPassed} days ago`;
  return new Intl.DateTimeFormat(locale).format(date);
};

const formatCur = (value, locale, currency) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

// ═══════════════════════════════════════════════
// UI FUNCTIONS (unchanged from original)
// ═══════════════════════════════════════════════

const displayMovements = (acc, sort = false) => {
  containerMovements.innerHTML = "";

  const combined = acc.movements.map((mov, i) => ({
    movement: mov,
    movementDate: acc.movementsDates.at(i),
  }));

  if (sort) combined.sort((a, b) => a.movement - b.movement);

  combined.forEach((obj, i) => {
    const { movement, movementDate } = obj;
    const type = movement > 0 ? "deposit" : "withdrawal";
    const date = new Date(movementDate);
    const displayDate = formatMovementDate(date, acc.locale);
    const formattedMov = formatCur(movement, acc.locale, acc.currency);

    containerMovements.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formattedMov}</div>
      </div>
    `,
    );
  });
};

const calcDisplayBalance = (acc) => {
  acc.balance = acc.movements.reduce((a, m) => a + m, 0);
  labelBalance.textContent = formatCur(acc.balance, acc.locale, acc.currency);
};

const calcDisplaySummary = (acc) => {
  const incomes = acc.movements.filter((m) => m > 0).reduce((a, m) => a + m, 0);
  labelSumIn.textContent = formatCur(incomes, acc.locale, acc.currency);

  const out = Math.abs(
    acc.movements.filter((m) => m < 0).reduce((a, m) => a + m, 0),
  );
  labelSumOut.textContent = formatCur(out, acc.locale, acc.currency);

  const interest = acc.movements
    .filter((m) => m > 0)
    .map((d) => (d * acc.interestRate) / 100)
    .filter((i) => i >= 1)
    .reduce((a, i) => a + i, 0);
  labelSumInterest.textContent = formatCur(interest, acc.locale, acc.currency);
};

const updateUI = (acc) => {
  displayMovements(acc);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
};

// ═══════════════════════════════════════════════
// LOGOUT TIMER
// ═══════════════════════════════════════════════

let timer;

const startLogOutTimer = () => {
  const tick = () => {
    const min = String(Math.trunc(time / 60)).padStart(2, "0");
    const sec = String(time % 60).padStart(2, "0");
    labelTimer.textContent = `${min}:${sec}`;

    if (time === 0) {
      clearInterval(timer);
      clearSession();
      currentAccount = null;
      showLogin();
    }
    time--;
  };

  let time = 120;
  tick();
  return setInterval(tick, 1000);
};

// ═══════════════════════════════════════════════
// BOOT DASHBOARD (called on login or session restore)
// ═══════════════════════════════════════════════

let currentAccount;

const bootDashboard = (acc) => {
  currentAccount = acc;

  // Welcome message
  labelWelcome.textContent = `Welcome back, ${acc.owner.split(" ")[0]}!`;

  // Date
  const now = new Date();
  labelDate.textContent = new Intl.DateTimeFormat(acc.locale, {
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(now);

  // Timer
  if (timer) clearInterval(timer);
  timer = startLogOutTimer();

  // UI
  updateUI(acc);

  // Switch screen
  showDashboard();
};

// ═══════════════════════════════════════════════
// RESTORE SESSION ON PAGE LOAD
// ═══════════════════════════════════════════════

const saved = loadSession();
if (saved) {
  bootDashboard(saved);
} else {
  showLogin();
}

// ═══════════════════════════════════════════════
// LOGIN FORM → calls Express backend
// ═══════════════════════════════════════════════

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  loginBtn.disabled = true;
  loginBtn.querySelector(".btn-text").textContent = "Signing in...";

  const username = inputLoginUsername.value.trim();
  const pin = inputLoginPin.value.trim();

  try {
    const res = await fetch("https://bankist-server.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || "Invalid credentials";
      return;
    }

    saveSession(data.account);
    inputLoginUsername.value = inputLoginPin.value = "";
    bootDashboard(data.account);
  } catch {
    loginError.textContent = "Cannot reach server. Is server.js running?";
  } finally {
    loginBtn.disabled = false;
    loginBtn.querySelector(".btn-text").textContent = "Sign in";
  }
});

// ═══════════════════════════════════════════════
// LOGOUT BUTTON
// ═══════════════════════════════════════════════

logoutBtn.addEventListener("click", () => {
  clearInterval(timer);
  clearSession();
  currentAccount = null;
  showLogin();
});

// ═══════════════════════════════════════════════
// TRANSFER
// ═══════════════════════════════════════════════

btnTransfer.addEventListener("click", (e) => {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  inputTransferAmount.value = inputTransferTo.value = "";

  if (amount > 0 && currentAccount.balance >= amount) {
    currentAccount.movements.push(-amount);
    currentAccount.movementsDates.push(new Date().toISOString());
    saveSession(currentAccount);
    updateUI(currentAccount);
    clearInterval(timer);
    timer = startLogOutTimer();
  }
});

// ═══════════════════════════════════════════════
// LOAN
// ═══════════════════════════════════════════════

btnLoan.addEventListener("click", (e) => {
  e.preventDefault();
  const amount = Math.floor(inputLoanAmount.value);

  if (amount > 0 && currentAccount.movements.some((m) => m >= amount * 0.1)) {
    setTimeout(() => {
      currentAccount.movements.push(amount);
      currentAccount.movementsDates.push(new Date().toISOString());
      saveSession(currentAccount);
      updateUI(currentAccount);
      clearInterval(timer);
      timer = startLogOutTimer();
    }, 2500);
  }
  inputLoanAmount.value = "";
});

// ═══════════════════════════════════════════════
// CLOSE ACCOUNT
// ═══════════════════════════════════════════════

btnClose.addEventListener("click", (e) => {
  e.preventDefault();
  if (inputCloseUsername.value === currentAccount.username) {
    clearSession();
    currentAccount = null;
    clearInterval(timer);
    showLogin();
  }
  inputCloseUsername.value = inputClosePin.value = "";
});

// ═══════════════════════════════════════════════
// SORT
// ═══════════════════════════════════════════════

let sorted = false;
btnSort.addEventListener("click", (e) => {
  e.preventDefault();
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
});
