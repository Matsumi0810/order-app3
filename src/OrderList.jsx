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
  const [now, setNow] = useState(new Date());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    try {
      const batch = writeBatch(db);
      deleteTarget.ids.forEach((id) => {
        batch.delete(doc(db, "orders", id));
      });
      await batch.commit();
      setDeleteTarget(null);
    } catch (e) {
      console.error("削除エラー:", e);
    }
  };

  const handleBulkDelete = async () => {
    const doneOrders = orders.filter(o => o.status === "done");
    if (doneOrders.length === 0) return;
    try {
      const batch = writeBatch(db);
      doneOrders.forEach((order) => {
        batch.delete(doc(db, "orders", order.id));
      });
      await batch.commit();
      setIsBulkDelete(false);
    } catch (e) {
      console.error("一括削除エラー:", e);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";
    const date = timestamp.toDate();
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getElapsedTimeInfo = (timestamp) => {
    if (!timestamp) return { text: "0分0秒", isUrgent: false };
    const startTime = timestamp.toDate();
    const diffInSec = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(diffInSec / 60);
    const seconds = diffInSec % 60;
    return {
      text: `${minutes}分${seconds}秒`,
      isUrgent: minutes >= 10,
    };
  };

  const cookingOrdersByTable = orders
    .filter((order) => order.status === "cooking")
    .reduce((groups, order) => {
      const table = order.tableNo || "不明";
      if (!groups[table]) {
        groups[table] = {
          items: {},
          firstOrderTime: order.createdAt,
        };
      }
      if (!groups[table].items[order.itemName]) {
        groups[table].items[order.itemName] = { ids: [], count: 0 };
      }
      groups[table].items[order.itemName].ids.push(order.id);
      groups[table].items[order.itemName].count += 1;
      return groups;
    }, {});

  const doneOrdersGrouped = orders
    .filter((order) => order.status === "done")
    .reduce((groups, order) => {
      const timeStr = formatTime(order.createdAt);
      const table = order.tableNo || "不明";
      const groupKey = `${table}-${timeStr}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          tableNo: table,
          time: timeStr,
          items: {},
          ids: [],
          rawTime: order.createdAt ? order.createdAt.toDate() : new Date(0),
        };
      }

      if (!groups[groupKey].items[order.itemName]) {
        groups[groupKey].items[order.itemName] = 0;
      }
      groups[groupKey].items[order.itemName] += 1;
      groups[groupKey].ids.push(order.id);
      return groups;
    }, {});

  const sortedDoneGroups = Object.values(doneOrdersGrouped).sort(
    (a, b) => b.rawTime - a.rawTime
  );

  const displayHistory = isExpanded ? sortedDoneGroups : sortedDoneGroups.slice(0, 4);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>🔥 調理待ち（テーブル別）</h2>
      <div className={styles.tableGrid}>
        {Object.keys(cookingOrdersByTable).map((tableNo) => {
          const timeInfo = getElapsedTimeInfo(cookingOrdersByTable[tableNo].firstOrderTime);
          return (
            <div key={tableNo} className={styles.tableCard}>
              <h3 className={styles.tableHeader}>{tableNo} 番テーブル</h3>
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
              <div className={styles.orderFooter}>
                <span className={styles.orderTime}>
                  時刻 {formatTime(cookingOrdersByTable[tableNo].firstOrderTime)}
                </span>
                <span className={timeInfo.isUrgent ? styles.urgentTime : styles.elapsedTime}>
                  経過: {timeInfo.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.historySectionHeader}>
        <h2 className={styles.sectionTitle}>✅ 最近完了した注文</h2>
        {sortedDoneGroups.length > 0 && (
          <button className={styles.bulkDeleteButton} onClick={() => setIsBulkDelete(true)}>
            履歴を全件削除
          </button>
        )}
      </div>

      <div className={styles.historyGrid}>
        {displayHistory.map((group, index) => (
          <div key={index} className={styles.historyCard}>
            <div className={styles.historyCardHeader}>
              <span className={styles.historyTableNo}>{group.tableNo}</span>
              <span className={styles.historyTimeBadge}>{group.time}</span>
            </div>
            <ul className={styles.historyItemList}>
              {Object.entries(group.items).map(([name, count]) => (
                <li key={name} className={styles.historyItemRow}>
                  <span className={styles.historyItemName}>{name}</span>
                  <span className={styles.historyItemCount}>{count}</span>
                </li>
              ))}
            </ul>
            <button 
              className={styles.deleteIconButton} 
              onClick={() => setDeleteTarget(group)}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {sortedDoneGroups.length > 4 && (
        <button className={styles.expandButton} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "閉じる ▲" : `もっと見る (${sortedDoneGroups.length - 4}件) ＋`}
        </button>
      )}

      {deleteTarget && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              <strong>{deleteTarget.tableNo} 番テーブル</strong><br />
              （{deleteTarget.time} の注文）を<br />
              本当に削除しますか？
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelButton} onClick={() => setDeleteTarget(null)}>いいえ</button>
              <button className={styles.confirmButton} onClick={handleDeleteGroup}>はい</button>
            </div>
          </div>
        </div>
      )}

      {isBulkDelete && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              <strong>履歴の全件削除</strong><br />
              完了した注文データをすべて削除します。<br />
              よろしいですか？
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelButton} onClick={() => setIsBulkDelete(false)}>いいえ</button>
              <button className={styles.confirmButton} onClick={handleBulkDelete}>すべて削除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderList;
