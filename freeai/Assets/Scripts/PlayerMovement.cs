// Basic player movement for Fable 5
using UnityEngine;
public class PlayerMovement : MonoBehaviour {
    public float walkSpeed = 5f;
    public float runSpeed = 8f;
    public bool isRunning = false;

    void Update() {
        float move = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");
        Vector3 movement = new Vector3(move, 0, vertical);
        float currentSpeed = isRunning ? runSpeed : walkSpeed;
        rigidbody.velocity = movement * currentSpeed;
    }

    // Add sprint toggle via key press (e.g., Left Shift)
    void FixedUpdate() {
        if (Input.GetKeyDown(KeyCode.LeftShift)) {
            isRunning = !isRunning;
        }
    }
}
