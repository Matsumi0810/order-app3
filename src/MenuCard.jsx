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

function MenuCard() {
  const [cart, setCart] = useState([]);

  // カートに追加
  const addToCart = (item) => {
    // Math.random().toString(36) でランダムな文字列を作り、
    // .slice(2) で「0.」の部分を切り落としています。
    const randomStr = Math.random().toString(36).slice(2);
    const uniqueId = `${Date.now()}-${randomStr}`;

    const cartItem = {
      ...item,
      cartId: uniqueId,
    };
    setCart([...cart, cartItem]);
  };

  // カートから削除
  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  // 注文確定（Firebaseへ送信）
  const submitOrder = async () => {
    if (cart.length === 0) return;

    try {
      const promises = cart.map((item) =>
        addDoc(collection(db, "orders"), {
          itemName: item.name,
          price: item.price,
          status: "cooking",
          tableNo: "tableNo",
          createdAt: serverTimestamp(),
        }),
      );

      await Promise.all(promises);

      alert("注文を送信しました！");
      setCart([]);
    } catch (e) {
      console.error("Firebase送信エラー: ", e);
      alert("注文の送信に失敗しました。");
    }
  };

  // 合計金額
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className={styles.menuContainer}>
      <h2 className={styles.menuTitle}>お食事メニュー</h2>

      <div className={styles.menuGrid}>
        {menuItems.map((item) => (
          <div key={item.id} className={styles.menuCard}>
            <h3 className={styles.itemName}>{item.name}</h3>
            <p className={styles.itemPrice}>{item.price.toLocaleString()}円</p>
            <button
              className={styles.orderButton}
              onClick={() => addToCart(item)}
            >
              カートに入れる
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartSection}>
        <h2 className={styles.cartTitle}>注文を確認する</h2>
        {cart.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999" }}>カートは空です</p>
        ) : (
          <>
            <ul className={styles.cartList}>
              {cart.map((item) => (
                <li key={item.cartId} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartItemName}>{item.name}</span>
                    <span className={styles.cartItemPrice}>
                      {item.price.toLocaleString()}円
                    </span>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={() => removeFromCart(item.cartId)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
            <button className={styles.submitOrderButton} onClick={submitOrder}>
              合計 {totalPrice.toLocaleString()}円を注文する
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MenuCard;
