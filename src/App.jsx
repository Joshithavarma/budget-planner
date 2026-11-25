import React, { useState, useEffect } from "react";

function App() {
  const [page, setPage] = useState("home");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [income, setIncome] = useState(0);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [incomeInput, setIncomeInput] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const [savingsGoal, setSavingsGoal] = useState(0);
  const [goalInput, setGoalInput] = useState("");

  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [budgetInput, setBudgetInput] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0")
  );

  // Get transaction month
  const getMonthKey = (item) => {
    if (item.dateKey) {
      return item.dateKey.slice(0, 7);
    }

    if (!item.date) return "";

    const parts = item.date.split("/");

    if (parts.length === 3) {
      const first = Number(parts[0]);
      const second = Number(parts[1]);
      const year = parts[2];

      const month = first > 12 ? second : first;

      return `${year}-${String(month).padStart(2, "0")}`;
    }

    return "";
  };

  // Display date
  const getDisplayDate = (item) => {
    if (item.dateKey) {
      return new Date(
        item.dateKey + "T00:00:00"
      ).toLocaleDateString("en-IN");
    }

    return item.date || "";
  };

  // Load saved budget data
  useEffect(() => {
    if (currentUser) {
      const saved = JSON.parse(
        localStorage.getItem("budget_" + currentUser.email)
      ) || {};

      setIncome(saved.income || 0);
      setIncomeHistory(saved.incomeHistory || []);
      setExpenses(saved.expenses || []);
      setSavingsGoal(saved.savingsGoal || 0);
      setMonthlyBudgets(saved.monthlyBudgets || {});
      setBudgetInput(
        saved.monthlyBudgets?.[selectedMonth]
          ? String(saved.monthlyBudgets[selectedMonth])
          : ""
      );
    }
  }, [currentUser]);

  // Save budget data
  const saveBudget = (
    newIncome,
    newExpenses,
    newGoal,
    newIncomeHistory = incomeHistory
  ) => {
    if (!currentUser) return;

    localStorage.setItem(
      "budget_" + currentUser.email,
      JSON.stringify({
        income: newIncome,
        incomeHistory: newIncomeHistory,
        expenses: newExpenses,
        savingsGoal: newGoal,
        monthlyBudgets: monthlyBudgets
      })
    );
  };

  // Signup
  const signup = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setMessage("Please fill all fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some((user) => user.email === email.trim())) {
      setMessage("Email already registered. Please login.");
      return;
    }

    users.push({
      name: name.trim(),
      email: email.trim(),
      password
    });

    localStorage.setItem("users", JSON.stringify(users));

    setName("");
    setEmail("");
    setPassword("");
    setMessage("Account created! Please login.");
    setPage("login");
  };

  // Login
  const login = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (u) => u.email === email.trim() && u.password === password
    );

    if (user) {
      setCurrentUser(user);
      setMessage("");
      setPage("dashboard");
      setEmail("");
      setPassword("");
    } else {
      setMessage("Invalid email or password.");
    }
  };

  // Add Income
  const addIncome = (e) => {
    e.preventDefault();

    const amount = Number(incomeInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid income amount.");
      return;
    }

    const updatedIncome = income + amount;
    const today = new Date();

    const newEntry = {
      id: Date.now(),
      amount,
      date: today.toLocaleDateString("en-IN"),
      dateKey: [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-")
    };

    const updatedHistory = [...incomeHistory, newEntry];

    setIncome(updatedIncome);
    setIncomeHistory(updatedHistory);

    saveBudget(
      updatedIncome,
      expenses,
      savingsGoal,
      updatedHistory
    );

    setIncomeInput("");
  };

  // Delete Income
  const deleteIncome = (id) => {
    const deletedItem = incomeHistory.find(
      (item) => item.id === id
    );

    if (!deletedItem) return;

    const updatedHistory = incomeHistory.filter(
      (item) => item.id !== id
    );

    const updatedIncome = Math.max(
      0,
      income - Number(deletedItem.amount)
    );

    setIncomeHistory(updatedHistory);
    setIncome(updatedIncome);

    saveBudget(
      updatedIncome,
      expenses,
      savingsGoal,
      updatedHistory
    );
  };

  // Add Expense
  const addExpense = (e) => {
    e.preventDefault();

    const amount = Number(expenseAmount);

    if (
      !expenseName.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Enter a valid expense name and amount.");
      return;
    }

    const today = new Date();

    const newExpense = {
      id: Date.now(),
      name: expenseName.trim(),
      amount,
      category,
      date: today.toLocaleDateString("en-IN"),
      dateKey: [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-")
    };

    const updated = [...expenses, newExpense];

    setExpenses(updated);
    saveBudget(income, updated, savingsGoal);

    setExpenseName("");
    setExpenseAmount("");
  };

  // Delete Expense
  const deleteExpense = (id) => {
    const updated = expenses.filter(
      (item) => item.id !== id
    );

    setExpenses(updated);
    saveBudget(income, updated, savingsGoal);
  };

  // Update Savings Goal
  const updateGoal = (e) => {
    e.preventDefault();

    const amount = Number(goalInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid savings goal.");
      return;
    }

    setSavingsGoal(amount);
    saveBudget(income, expenses, amount);

    setGoalInput("");
  };

  // Set Monthly Budget
  const updateMonthlyBudget = (e) => {
    e.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid monthly budget limit.");
      return;
    }

    const updatedBudgets = {
      ...monthlyBudgets,
      [selectedMonth]: amount
    };

    setMonthlyBudgets(updatedBudgets);

    localStorage.setItem(
      "budget_" + currentUser.email,
      JSON.stringify({
        income,
        incomeHistory,
        expenses,
        savingsGoal,
        monthlyBudgets: updatedBudgets
      })
    );

    alert("Monthly budget limit saved successfully!");
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setIncome(0);
    setIncomeHistory([]);
    setExpenses([]);
    setSavingsGoal(0);
    setMonthlyBudgets({});
    setBudgetInput("");
    setMessage("");
    setPage("home");
  };

  // Overall calculations
  const totalExpenses = expenses.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const balance = income - totalExpenses;

  // Monthly calculations
  const monthlyExpenses = expenses.filter(
    (item) => getMonthKey(item) === selectedMonth
  );

  const monthlyIncome = incomeHistory.filter(
    (item) => getMonthKey(item) === selectedMonth
  );

  const monthlyTotalIncome = monthlyIncome.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const monthlyTotalExpenses = monthlyExpenses.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const monthlyBalance =
    monthlyTotalIncome - monthlyTotalExpenses;

  // Monthly Budget Calculations
  const selectedMonthBudget = Number(
    monthlyBudgets[selectedMonth] || 0
  );

  const budgetRemaining =
    selectedMonthBudget - monthlyTotalExpenses;

  const budgetUsage =
    selectedMonthBudget > 0
      ? (monthlyTotalExpenses / selectedMonthBudget) * 100
      : 0;

  // Category totals
  const monthlyCategoryTotals = monthlyExpenses.reduce(
    (result, item) => {
      result[item.category] =
        (result[item.category] || 0) + Number(item.amount);

      return result;
    },
    {}
  );

  const categoryTotals = expenses.reduce((result, item) => {
    result[item.category] =
      (result[item.category] || 0) + Number(item.amount);

    return result;
  }, {});

  const chartColors = [
    "#2563eb",
    "#e11d48",
    "#059669",
    "#f59e0b",
    "#9333ea",
    "#0891b2"
  ];

  let chartPosition = 0;

  const chartGradient = Object.entries(categoryTotals)
    .map(([cat, amount], index) => {
      const start = chartPosition;

      chartPosition += totalExpenses
        ? (amount / totalExpenses) * 100
        : 0;

      return `${chartColors[index % chartColors.length]} ${start}% ${chartPosition}%`;
    })
    .join(", ");

  const savingsProgress =
    savingsGoal > 0
      ? Math.min(
          Math.max((Math.max(balance, 0) / savingsGoal) * 100, 0),
          100
        )
      : 0;

  const formattedMonth = new Date(
    selectedMonth + "-01T00:00:00"
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="app">

      {/* HOME PAGE */}
      {page === "home" && (
        <div className="auth-container">
          <div className="brand-icon">₹</div>
          <h1>Budget Planner</h1>
          <h2>Manage Your Money Smartly</h2>

          <p>
            Track your income, expenses and savings in one place.
          </p>

          <button onClick={() => {
            setMessage("");
            setPage("signup");
          }}>
            Sign Up
          </button>

          <button
            className="secondary-btn"
            onClick={() => {
              setMessage("");
              setPage("login");
            }}
          >
            Login
          </button>
        </div>
      )}

      {/* SIGNUP PAGE */}
      {page === "signup" && (
        <div className="auth-container">
          <h1>Create Account</h1>
          <p>Start managing your money today.</p>

          <form onSubmit={signup}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Create Account</button>
          </form>

          <p className="message">{message}</p>

          <p>
            Already registered?
            <button
              className="text-btn"
              onClick={() => {
                setMessage("");
                setPage("login");
              }}
            >
              Login
            </button>
          </p>

          <button
            className="secondary-btn"
            onClick={() => setPage("home")}
          >
            Back Home
          </button>
        </div>
      )}

      {/* LOGIN PAGE */}
      {page === "login" && (
        <div className="auth-container">
          <h1>Welcome Back!</h1>
          <p>Login to your Budget Planner account.</p>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Login</button>
          </form>

          <p className="message">{message}</p>

          <p>
            New user?
            <button
              className="text-btn"
              onClick={() => {
                setMessage("");
                setPage("signup");
              }}
            >
              Sign Up
            </button>
          </p>

          <button
            className="secondary-btn"
            onClick={() => setPage("home")}
          >
            Back Home
          </button>
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && currentUser && (
        <div className="dashboard">

          <header className="topbar">
            <div>
              <h1>₹ Budget Planner</h1>
              <p>Personal Finance Dashboard</p>
            </div>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </header>

          <section className="welcome">
            <h2>Welcome, {currentUser.name}!</h2>
            <p>{currentUser.email}</p>
          </section>

          {/* SUMMARY CARDS */}
          <section className="dashboard-cards">
            <div className="stat-card income-card">
              <span>Total Income</span>
              <h2>₹{income.toLocaleString("en-IN")}</h2>
              <p>Your total earnings</p>
            </div>

            <div className="stat-card expense-card">
              <span>Total Expenses</span>
              <h2>₹{totalExpenses.toLocaleString("en-IN")}</h2>
              <p>Your total spending</p>
            </div>

            <div className="stat-card balance-card">
              <span>Remaining Balance</span>
              <h2>₹{balance.toLocaleString("en-IN")}</h2>
              <p>Your available money</p>
            </div>
          </section>

          {/* ADD INCOME AND EXPENSE */}
          <section className="forms-grid">
            <div className="panel">
              <h3>＋ Add Income</h3>

              <form onSubmit={addIncome}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter income amount"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                />

                <button type="submit">Add Income</button>
              </form>
            </div>

            <div className="panel">
              <h3>－ Add Expense</h3>

              <form onSubmit={addExpense}>
                <input
                  placeholder="Expense name"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                />

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Expense amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                  <option>Education</option>
                  <option>Health</option>
                  <option>Other</option>
                </select>

                <button type="submit">Add Expense</button>
              </form>
            </div>
          </section>

          {/* ANALYTICS */}
          <section className="analytics-grid">
            <div className="panel">
              <h3>Expense Distribution</h3>

              {totalExpenses === 0 ? (
                <p className="empty">
                  Add expenses to view your chart.
                </p>
              ) : (
                <>
                  <div
                    className="chart"
                    style={{
                      background: `conic-gradient(${chartGradient})`
                    }}
                  ></div>

                  <div className="legend">
                    {Object.entries(categoryTotals).map(
                      ([cat, amount], index) => (
                        <div key={cat}>
                          <span
                            style={{
                              background:
                                chartColors[index % chartColors.length]
                            }}
                          ></span>

                          {cat}: ₹{amount.toLocaleString("en-IN")}
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="panel">
              <h3>Overall Spending Summary</h3>

              <div className="summary-row">
                <span>Total Income</span>
                <strong>₹{income.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-row">
                <span>Total Expenses</span>
                <strong>₹{totalExpenses.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-row">
                <span>Available Balance</span>
                <strong>₹{balance.toLocaleString("en-IN")}</strong>
              </div>

              <p className="summary-note">
                All-time totals for your recorded transactions.
              </p>
            </div>
          </section>

          {/* MONTHLY TRACKING */}
          <section className="panel monthly-panel">
            <h3>📅 Monthly Expense Tracking</h3>

            <p>Select a month to view your financial report.</p>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                const month = e.target.value;
                setSelectedMonth(month);
                setBudgetInput(
                  monthlyBudgets[month]
                    ? String(monthlyBudgets[month])
                    : ""
                );
              }}
            />

            <h3>{formattedMonth} Report</h3>

            <div className="dashboard-cards">
              <div className="stat-card income-card">
                <span>Monthly Income</span>
                <h2>₹{monthlyTotalIncome.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card expense-card">
                <span>Monthly Expenses</span>
                <h2>₹{monthlyTotalExpenses.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card balance-card">
                <span>Monthly Balance</span>
                <h2>₹{monthlyBalance.toLocaleString("en-IN")}</h2>
              </div>
            </div>

            {/* MONTHLY BUDGET LIMIT */}
            <div className="panel">
              <h3>🎯 Monthly Budget Limit</h3>

              <p>
                Set your spending limit for {formattedMonth}.
              </p>

              <form onSubmit={updateMonthlyBudget}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter monthly budget limit"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />

                <button type="submit">
                  Save Monthly Budget
                </button>
              </form>

              {selectedMonthBudget > 0 ? (
                <>
                  <div className="summary-row">
                    <span>Monthly Budget</span>
                    <strong>
                      ₹{selectedMonthBudget.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Amount Spent</span>
                    <strong>
                      ₹{monthlyTotalExpenses.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>
                      {budgetRemaining >= 0
                        ? "Budget Remaining"
                        : "Amount Over Budget"}
                    </span>

                    <strong>
                      ₹{Math.abs(budgetRemaining).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(budgetUsage, 100)}%`,
                        background:
                          budgetUsage > 100
                            ? "#dc2626"
                            : budgetUsage >= 80
                            ? "#f59e0b"
                            : "#16a34a"
                      }}
                    ></div>
                  </div>

                  <p>
                    {budgetUsage.toFixed(1)}% of your monthly budget used.
                  </p>

                  {budgetUsage > 100 ? (
                    <div
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ⚠️ Budget Exceeded! You have spent more than your monthly limit.
                    </div>
                  ) : budgetUsage >= 80 ? (
                    <div
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ⚠️ Warning! You have used 80% or more of your monthly budget.
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ✓ You are within your monthly budget. Keep it up!
                    </div>
                  )}
                </>
              ) : (
                <p className="empty">
                  Set a monthly budget limit to track your spending.
                </p>
              )}
            </div>

            <h3>Monthly Category Breakdown</h3>

            {Object.keys(monthlyCategoryTotals).length === 0 ? (
              <p className="empty">
                No expenses recorded for {formattedMonth}.
              </p>
            ) : (
              Object.entries(monthlyCategoryTotals).map(
                ([cat, amount], index) => (
                  <div className="summary-row" key={cat}>
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background:
                            chartColors[index % chartColors.length],
                          marginRight: "8px"
                        }}
                      ></span>
                      {cat}
                    </span>

                    <strong>
                      ₹{amount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )
              )
            )}

            <h3>Transactions for {formattedMonth}</h3>

            {monthlyExpenses.length === 0 ? (
              <p className="empty">
                No monthly transactions available.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyExpenses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>
                        <td>{getDisplayDate(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SAVINGS GOAL */}
          <section className="panel savings-panel">
            <h3>My Savings Goal</h3>

            <form onSubmit={updateGoal}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter your savings target"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />

              <button type="submit">Set Goal</button>
            </form>

            {savingsGoal > 0 && (
              <>
                <div className="summary-row">
                  <span>
                    Goal: ₹{savingsGoal.toLocaleString("en-IN")}
                  </span>

                  <strong>{savingsProgress.toFixed(1)}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${savingsProgress}%` }}
                  ></div>
                </div>

                <p className="summary-note">
                  Progress is based on your current remaining balance.
                </p>
              </>
            )}
          </section>

          {/* INCOME HISTORY */}
          <section className="panel history-panel">
            <h3>Income History</h3>

            {incomeHistory.length === 0 ? (
              <p className="empty">No income added yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Income Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {incomeHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>

                        <td>{getDisplayDate(item)}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteIncome(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* EXPENSE HISTORY */}
          <section className="panel history-panel">
            <h3>Expense History</h3>

            {expenses.length === 0 ? (
              <p className="empty">No expenses added yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>

                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>

                        <td>{getDisplayDate(item)}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteExpense(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer>
            <p>
              © 2026 Budget Planner | Manage Your Money Smartly
            </p>
          </footer>

        </div>
      )}
    </div>
  );
}

export default App;