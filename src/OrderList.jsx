import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import styles from "./OrderList.module.scss";

function OrderList() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orderArray = [];
      querySnapshot.forEach((doc) => {
        orderArray.push({ id: doc.id, ...doc.data() });
      });
      setOrders(orderArray);
    });
    return () => unsubscribe();
  }, []);

  const handleComplete = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "done" });
    } catch (e) {
      console.error(e);
    }
  };

  // 調理中の注文をテーブルごとにグループ化する
  const cookingOrdersByTable = orders
    .filter((order) => order.status === "cooking")
    .reduce((groups, order) => {
      const table = order.tableNo || "不明";
      if (!groups[table]) {
        groups[table] = [];
      }
      groups[table].push(order);
      return groups;
    }, {});

  // 完了した注文（履歴用）
  const doneOrders = orders.filter((order) => order.status === "done");

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>🔥 調理待ち（テーブル別）</h2>

      <div className={styles.tableGrid}>
        {Object.keys(cookingOrdersByTable).map((tableNo) => (
          <div key={tableNo} className={styles.tableCard}>
            <h3 className={styles.tableHeader}>{tableNo} 番テーブル</h3>
            <ul className={styles.itemList}>
              {cookingOrdersByTable[tableNo].map((order) => (
                <li key={order.id} className={styles.itemRow}>
                  <span>{order.itemName}</span>
                  <button
                    className={styles.miniDoneButton}
                    onClick={() => handleComplete(order.id)}
                  >
                    完了
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>✅ 最近完了した注文</h2>
      <ul className={styles.historyList}>
        {doneOrders
          .slice(-10)
          .reverse()
          .map((order) => (
            <li key={order.id} className={styles.historyItem}>
              {order.tableNo}: {order.itemName}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default OrderList;
