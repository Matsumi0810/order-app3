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

  // 同じ商品の全件を一度に「完了」にする処理
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

  // 調理中の注文を「テーブル別」→「商品別」に集計する
  const cookingOrdersByTable = orders
    .filter((order) => order.status === "cooking")
    .reduce((groups, order) => {
      const table = order.tableNo || "不明";
      if (!groups[table]) groups[table] = {};
      
      if (!groups[table][order.itemName]) {
        groups[table][order.itemName] = { ids: [], count: 0 };
      }
      groups[table][order.itemName].ids.push(order.id);
      groups[table][order.itemName].count += 1;
      
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
            <h3 className={styles.tableHeader}>{tableNo} 番テーブル</h3>
            
            {/* 表のヘッダー */}
            <div className={styles.itemTableHeader}>
              <span>商品名</span>
              <span>個数</span>
              <span>操作</span>
            </div>

            <ul className={styles.itemList}>
              {Object.keys(cookingOrdersByTable[tableNo]).map((itemName) => (
                <li key={itemName} className={styles.itemRow}>
                  <span className={styles.itemName}>{itemName}</span>
                  <span className={styles.itemCount}>{cookingOrdersByTable[tableNo][itemName].count}</span>
                  <button
                    className={styles.miniDoneButton}
                    onClick={() => handleCompleteGroup(cookingOrdersByTable[tableNo][itemName].ids)}
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
            {order.tableNo} 番テーブル: {order.itemName}
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
