import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import styles from "./AdminPanel.module.scss";

function AdminPanel() {
  const [totalSales, setTotalSales] = useState(0);

  const calculateSales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += doc.data().price || 0;
      });
      setTotalSales(total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    calculateSales();
  }, []);

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.adminTitle}>管理者用ダッシュボード</h2>

      <div className={styles.salesCard}>
        <span className={styles.salesLabel}>本日の総売上</span>
        <span className={styles.salesAmount}>
          {totalSales.toLocaleString()}
          <span className={styles.currency}>円</span>
        </span>
      </div>

      <button className={styles.updateButton} onClick={calculateSales}>
        最新の情報に更新する
      </button>

      <p className={styles.notice}>
        ※注文が入るたびに「更新」を押すと最新の売上が反映されます。
      </p>
    </div>
  );
}

export default AdminPanel;
