import { useState } from "react";
import MenuCard from "./MenuCard";
import OrderList from "./OrderList";
import AdminPanel from "./AdminPanel";
import styles from "./App.module.scss";

function App() {
  const [view, setView] = useState("customer");

  const params = new URLSearchParams(window.location.search);
  const tableNo = params.get("table") || "テイクアウト";

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navBar}>
        <button
          className={
            view === "customer" ? styles.activeButton : styles.navButton
          }
          onClick={() => setView("customer")}
        >
          客席画面
        </button>
        <button
          className={
            view === "kitchen" ? styles.activeButton : styles.navButton
          }
          onClick={() => setView("kitchen")}
        >
          厨房画面
        </button>
        <button
          className={view === "admin" ? styles.activeButton : styles.navButton}
          onClick={() => setView("admin")}
        >
          管理画面
        </button>
      </nav>

      <main className={styles.mainContent}>
        <header className={styles.appTitle}>
          {view === "customer" && <h2>テーブル番号: {tableNo}</h2>}
          {view === "kitchen" && <h2>厨房オーダー管理システム</h2>}
          {view === "admin" && <h2>店舗売上管理</h2>}
        </header>

        {view === "customer" && <MenuCard tableNo={tableNo} />}
        {view === "kitchen" && <OrderList />}
        {view === "admin" && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;
