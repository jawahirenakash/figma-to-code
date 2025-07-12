import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun GeneratedScreen() {
    Column(
        modifier = Modifier
    ) {
        Column(
            modifier = Modifier
                .width(375.dp)
                .height(80.dp)
                .background(Color.fromHex("#f2f2f2ff"))
        ) {
            Text(
                text = "Design System",

                    .width(200.dp)
                    .height(40.dp)
                    .background(Color.fromHex("#1a1a1aff"))
                    .offset(x = 20.dp, y = 20.dp)                color = Color.fromHex("#1a1a1aff"),
                fontSize = 24.sp,
                fontWeight = FontWeight.Normal,
            )
        }
        Column(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier
                .width(375.dp)
                .height(600.dp)
                .padding(20.dp, 20.dp, 20.dp, 20.dp)
                .offset(x = 0.dp, y = 80.dp)
        ) {
            Column(
                modifier = Modifier
                    .width(335.dp)
                    .height(120.dp)
                    .background(Color.fromHex("#ffffffff"))
                    .border(1.dp, Color.fromHex("#e6e6e6ff"))
                    .clip(RoundedCornerShape(8.dp))
                    .offset(x = 20.dp, y = 20.dp)
            ) {
                Text(
                    text = "Component Card",

                        .width(150.dp)
                        .height(24.dp)
                        .background(Color.fromHex("#333333ff"))
                        .offset(x = 20.dp, y = 100.dp)                    color = Color.fromHex("#333333ff"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Normal,
                )
                Text(
                    text = "This is a sample component card with some description text.",

                        .width(295.dp)
                        .height(40.dp)
                        .background(Color.fromHex("#808080ff"))
                        .offset(x = 20.dp, y = 130.dp)                    color = Color.fromHex("#808080ff"),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Normal,
                )
            }
            Column(
                modifier = Modifier
                    .width(335.dp)
                    .height(48.dp)
                    .background(Color.fromHex("#3399ffff"))
                    .clip(RoundedCornerShape(6.dp))
                    .offset(x = 20.dp, y = 176.dp)
            ) {
                Text(
                    text = "Click Me",

                        .width(60.dp)
                        .height(24.dp)
                        .background(Color.fromHex("#ffffffff"))
                        .offset(x = 155.dp, y = 92.dp)                    color = Color.fromHex("#ffffffff"),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Normal,
                )
            }
        }
    }
}

// Extension function for hex color support
fun Color.Companion.fromHex(hex: String): Color {
    val hexColor = hex.removePrefix("#")
    val color = android.graphics.Color.parseColor("#$hexColor")
    return Color(color)
}
