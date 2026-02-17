import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import styles from "./OrderList.module.scss";

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleCompleteGroup = async (orderIds) => {
    try {
      const batch = writeBatch(db);
      orderIds.forEach((id) => {
        const ref = doc(db, "orders", id);
        batch.update(ref, { status: "done" });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  // 時刻を「HH:mm」形式に変換するヘルパー関数
  const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";
    const date = timestamp.toDate(); // FirebaseのTimestampをDateオブジェクトに変換
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cookingOrdersByTable = orders
    .filter((order) => order.status === "cooking")
    .reduce((groups, order) => {
      const table = order.tableNo || "不明";
      if (!groups[table]) {
        groups[table] = {
          items: {},
          firstOrderTime: order.createdAt, // そのテーブルの最初の注文時刻を保持
        };
      }
      
      if (!groups[table].items[order.itemName]) {
        groups[table].items[order.itemName] = { ids: [], count: 0 };
      }
      groups[table].items[order.itemName].ids.push(order.id);
      groups[table].items[order.itemName].count += 1;
      
      return groups;
    }, {});

  const doneOrders = orders.filter((order) => order.status === "done").reverse();
  const displayOrders = isExpanded ? doneOrders : doneOrders.slice(0, 5);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>🔥 調理待ち（テーブル別）</h2>
      <div className={styles.tableGrid}>
        {Object.keys(cookingOrdersByTable).map((tableNo) => (
          <div key={tableNo} className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <h3 className={styles.tableHeader}>{tableNo} 番テーブル</h3>
              <span className={styles.orderTime}>
                注文時刻 {formatTime(cookingOrdersByTable[tableNo].firstOrderTime)}
              </span>
            </div>
            
            <div className={styles.itemTableHeader}>
              <span>商品名</span>
              <span>個数</span>
              <span>操作</span>
            </div>

            <ul className={styles.itemList}>
              {Object.keys(cookingOrdersByTable[tableNo].items).map((itemName) => (
                <li key={itemName} className={styles.itemRow}>
                  <span className={styles.itemName}>{itemName}</span>
                  <span className={styles.itemCount}>
                    {cookingOrdersByTable[tableNo].items[itemName].count}
                  </span>
                  <button
                    className={styles.miniDoneButton}
                    onClick={() => handleCompleteGroup(cookingOrdersByTable[tableNo].items[itemName].ids)}
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
        {displayOrders.map((order) => (
          <li key={order.id} className={styles.historyItem}>
            {order.tableNo} 番テーブル: {order.itemName} ({formatTime(order.createdAt)})
          </li>
        ))}
      </ul>

      {doneOrders.length > 5 && (
        <button className={styles.expandButton} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "閉じる ▲" : `もっと見る (${doneOrders.length - 5}件) ＋`}
        </button>
      )}
    </div>
  );
}

export default OrderList;
