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

  const handleCountChange = (id, delta) => {
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  // カートに追加
  const addToCart = (item) => {
    const count = counts[item.id] || 1;
    const newItems = [];
    
    for (let i = 0; i < count; i++) {
      const randomStr = Math.random().toString(36).slice(2);
      const uniqueId = `${Date.now()}-${randomStr}-${i}`;
      newItems.push({ ...item, cartId: uniqueId });
    }

    setCart([...cart, ...newItems]);
    setModal({ show: true, itemName: `${item.name} x ${count}` });
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  // 注文確定処理（引数で渡されたカート、または現在のカートを送信）
  const submitOrder = async (orderItems = cart) => {
    if (orderItems.length === 0) return;
    try {
      const promises = orderItems.map((item) =>
        addDoc(collection(db, "orders"), {
          itemName: item.name,
          price: item.price,
          status: "cooking",
          tableNo: tableNo,
          createdAt: serverTimestamp(),
        }),
      );
      await Promise.all(promises);
      alert("注文を送信しました！");
      setCart([]);
      setModal({ show: false, itemName: "" });
    } catch (e) {
      console.error("Firebase送信エラー: ", e);
      alert("注文の送信に失敗しました。");
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className={styles.menuContainer}>
      {/* 中央表示のポップアップ（モーダル） */}
      {modal.show && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              <strong>{modal.itemName}</strong> をカートに入れました
            </p>
            <div className={styles.modalButtons}>
              <button 
                className={styles.continueButton} 
                onClick={() => setModal({ show: false, itemName: "" })}
              >
                追加で注文する
              </button>
              <button 
                className={styles.directSubmitButton} 
                onClick={() => submitOrder()}
              >
                このまま注文を確定
              </button>
            </div>
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
            <ul className={styles.cartList}>
              {cart.map((item) => (
                <li key={item.cartId} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartItemName}>{item.name}</span>
                    <span className={styles.cartItemPrice}>{item.price.toLocaleString()}円</span>
                  </div>
                  <button className={styles.deleteButton} onClick={() => removeFromCart(item.cartId)}>削除</button>
                </li>
              ))}
            </ul>
            <button className={styles.submitOrderButton} onClick={() => submitOrder()}>
              カートの合計 {totalPrice.toLocaleString()}円を注文する
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MenuCard;
