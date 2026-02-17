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
  const [addedItemId, setAddedItemId] = useState(null);
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
    setIsSuccess(false);

    setAddedItemId(item.id);
    setTimeout(() => {
      setAddedItemId(null);
    }, 2000);
  };

  const updateCartItemCount = (itemName, delta) => {
    if (delta > 0) {
      const itemToClone = cart.find((item) => item.name === itemName);
      if (itemToClone) {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setCart([...cart, { ...itemToClone, cartId: uniqueId }]);
      }
    } else {
      const indexToRemove = cart.findLastIndex((item) => item.name === itemName);
      if (indexToRemove !== -1) {
        const newCart = [...cart];
        newCart.splice(indexToRemove, 1);
        setCart(newCart);
      }
    }
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
      setCounts({ 1: 1, 2: 1, 3: 1, 4: 1 });
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);

    } catch (e) {
      console.error("Firebase送信エラー: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { ...item, count: 0, subtotal: 0 };
    }
    acc[item.name].count += 1;
    acc[item.name].subtotal += item.price;
    return acc;
  }, {});

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className={styles.menuContainer}>
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
            <button 
              className={addedItemId === item.id ? styles.addedButton : styles.orderButton} 
              onClick={() => addToCart(item)}
            >
              {addedItemId === item.id ? "追加完了！" : "カートに入れる"}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartSection}>
        <h2 className={styles.cartTitle}>現在のカート内容</h2>
        {cart.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>カートは空です</p>
        ) : (
          <>
            <div className={styles.cartHeader}>
              <span className={styles.headName}>商品名</span>
              <span className={styles.headQty}>数量</span>
              <span className={styles.headPrice}>金額</span>
              <span className={styles.headAction}>操作</span>
            </div>
            <ul className={styles.cartList}>
              {Object.values(groupedCart).map((item) => (
                <li key={item.name} className={styles.cartItem}>
                  <div className={styles.cartItemMain}>
                    <span className={styles.cartItemName}>{item.name}</span>
                  </div>
                  <div className={styles.cartItemSub}>
                    <div className={styles.cartCounter}>
                      <button onClick={() => updateCartItemCount(item.name, -1)}>−</button>
                      <span className={styles.countNum}>{item.count}</span>
                      <button onClick={() => updateCartItemCount(item.name, 1)}>+</button>
                    </div>
                    <span className={styles.cartItemSubtotal}>{item.subtotal.toLocaleString()}円</span>
                    <button className={styles.deleteButton} onClick={() => removeFromCart(item.name)}>消す</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.cartFooter}>
              <div className={styles.totalLabel}>合計金額: {totalPrice.toLocaleString()}円</div>
              <button 
                className={isSuccess ? styles.successOrderButton : styles.submitOrderButton} 
                onClick={submitOrder}
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? "送信中..." : isSuccess ? "注文完了しました！" : "注文を確定する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MenuCard;
