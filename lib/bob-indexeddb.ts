"use client";

const DB_NAME = "qurux-bob-storage";
const DB_VERSION = 1;
const STORE_NAME = "paymentProofs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof window === "undefined" ||
      !("indexedDB" in window)
    ) {
      reject(
        new Error(
          "IndexedDB is not available in this browser."
        )
      );
      return;
    }

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("Could not open IndexedDB.")
      );
    };
  });
}

export async function saveBobPaymentProof(
  id: string,
  file: Blob
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction =
      db.transaction(
        STORE_NAME,
        "readwrite"
      );

    const store =
      transaction.objectStore(
        STORE_NAME
      );

    store.put(file, id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ||
          new Error(
            "Could not save payment proof."
          )
      );
    };
  });
}

export async function getBobPaymentProof(
  id: string
): Promise<Blob | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction =
      db.transaction(
        STORE_NAME,
        "readonly"
      );

    const request =
      transaction
        .objectStore(STORE_NAME)
        .get(id);

    request.onsuccess = () => {
      db.close();

      resolve(
        (request.result as
          | Blob
          | undefined) || null
      );
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ||
          new Error(
            "Could not read payment proof."
          )
      );
    };
  });
}

export async function deleteBobPaymentProof(
  id: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction =
      db.transaction(
        STORE_NAME,
        "readwrite"
      );

    transaction
      .objectStore(STORE_NAME)
      .delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ||
          new Error(
            "Could not delete payment proof."
          )
      );
    };
  });
}

export async function prepareBobPaymentProof(
  file: File,
  maxWidth = 1400,
  quality = 0.78
): Promise<Blob> {
  if (
    !file.type.startsWith("image/")
  ) {
    throw new Error(
      "Please select an image file."
    );
  }

  const bitmap =
    await createImageBitmap(file);

  const scale = Math.min(
    1,
    maxWidth / bitmap.width
  );

  const width = Math.max(
    1,
    Math.round(
      bitmap.width * scale
    )
  );

  const height = Math.max(
    1,
    Math.round(
      bitmap.height * scale
    )
  );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    bitmap.close();

    throw new Error(
      "Could not prepare image."
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  );

  bitmap.close();

  const blob =
    await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          quality
        );
      }
    );

  if (!blob) {
    throw new Error(
      "Could not compress payment screenshot."
    );
  }

  return blob;
}