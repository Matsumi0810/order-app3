import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import styles from "./MenuCard.module.scss";

const menuItems = [
  { id: 1, name: "オムライス", price: 850 },
  { id: 2, name: "カレーライス", price: 750 },
  { id: 3, name: "アイスコーヒー", price: 400 },
  { id: 4, name: "パンケーキ", price: 900 },
];

function MenuCard({ tableNo }) {
  const [cart, setCart] = useState([]);
  const [counts, setCounts] = useState({ 1: 1, 2: 1, 3: 1, 4: 1 });
  const [modal, setModal] = useState({ show: false, itemName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCountChange = (id, delta) => {
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const addToCart = (item) => {
    const count = counts[item.id] || 1;
    const newItems = [];
    for (let i = 0; i < count; i++) {
      const randomStr = Math.random().toString(36).slice(2);
      const uniqueId = `${Date.now()}-${randomStr}-${i}`;
      newItems.push({ ...item, cartId: uniqueId });
    }
    setCart([...cart, ...newItems]);
    setIsSuccess(false); // 新しく追加したら成功表示をリセット
    setModal({ show: true, itemName: `${item.name} x ${count}` });
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter((item) => item.name !== itemName));
  };

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const promises = cart.map((item) =>
        addDoc(collection(db, "orders"), {
          itemName: item.name,
          price: item.price,
          status: "cooking",
          tableNo: tableNo,
          createdAt: serverTimestamp(),
        }),
      );
      await Promise.all(promises);
      
      setCart([]);
      setIsSuccess(true);
      
      // 2秒後にモーダルを閉じる
      setTimeout(() => {
        setModal({ show: false, itemName: "" });
        setIsSuccess(false);
      }, 2000);

    } catch (e) {
      console.error("Firebase送信エラー: ", e);
      alert("送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { ...item, count: 0 };
    }
    acc[item.name].count += 1;
    return acc;
  }, {});

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className={styles.menuContainer}>
      {modal.show && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            {!isSuccess ? (
              <>
                <p className={styles.modalText}>
                  <strong>{modal.itemName}</strong> を追加しました
                </p>
                <div className={styles.modalButtons}>
                  <button className={styles.continueButton} onClick={() => setModal({ show: false, itemName: "" })}>
                    追加で注文する
                  </button>
                  <button 
                    className={styles.directSubmitButton} 
                    onClick={submitOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "送信中..." : "このまま注文を確定"}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.successMessage}>
                <div className={styles.checkIcon}>✅</div>
                <p>注文完了しました！</p>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className={styles.menuTitle}>お食事メニュー</h2>
      <div className={styles.menuGrid}>
        {menuItems.map((item) => (
          <div key={item.id} className={styles.menuCard}>
            <h3 className={styles.itemName}>{item.name}</h3>
            <p className={styles.itemPrice}>{item.price.toLocaleString()}円</p>
            <div className={styles.counter}>
              <button onClick={() => handleCountChange(item.id, -1)}>−</button>
              <span>{counts[item.id] || 1}</span>
              <button onClick={() => handleCountChange(item.id, 1)}>+</button>
            </div>
            <button className={styles.orderButton} onClick={() => addToCart(item)}>
              カートに入れる
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartSection}>
        <h2 className={styles.cartTitle}>現在のカート内容</h2>
        {cart.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999" }}>カートは空です</p>
        ) : (
          <>
            <div className={styles.cartHeader}>
              <span>商品名</span>
              <span>数量</span>
              <span>操作</span>
            </div>
            <ul className={styles.cartList}>
              {Object.values(groupedCart).map((item) => (
                <li key={item.name} className={styles.cartItem}>
                  <span className={styles.cartItemName}>{item.name}</span>
                  <span className={styles.cartItemCount}>x {item.count}</span>
                  <button className={styles.deleteButton} onClick={() => removeFromCart(item.name)}>消す</button>
                </li>
              ))}
            </ul>
            <button 
              className={isSuccess ? styles.successOrderButton : styles.submitOrderButton} 
              onClick={submitOrder}
              disabled={isSubmitting || isSuccess}
            >
              {isSuccess ? "注文完了！" : `合計 ${totalPrice.toLocaleString()}円を注文`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MenuCard;
